<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessVideoJob;
use App\Models\Tag;
use App\Models\Video;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VideoController extends Controller
{
    /**
     * 動画一覧
     * GET /api/videos
     */
    public function index(Request $request): JsonResponse
    {
        $videos = Video::published()
            ->with(['channel', 'tags'])
            ->when($request->search, fn($q) =>
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
            )
            ->when($request->tag, fn($q) =>
                $q->whereHas('tags', fn($t) => $t->where('slug', $request->tag))
            )
            ->latest('published_at')
            ->paginate(20);

        return response()->json($videos);
    }

    /**
     * 動画詳細
     * GET /api/videos/{video}
     */
    public function show(Video $video): JsonResponse
    {
        if ($video->status !== 'ready' || $video->visibility === 'private') {
            abort(404);
        }

        $video->increment('view_count');
        $video->load(['channel', 'tags', 'user']);

        // HLSプレイリストが存在するかどうかをフロントに伝える
        $hlsPath = 'videos/hls/' . $video->id . '/playlist.m3u8';
        $video->hls_available = Storage::disk('local')->exists($hlsPath);

        return response()->json($video);
    }

    /**
     * 動画アップロード
     * POST /api/videos
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'visibility'  => ['in:public,unlisted,private'],
            'tags'        => ['nullable', 'array', 'max:10'],
            'tags.*'      => ['string', 'max:50'],
            'video'       => [
                'required',
                'file',
                'mimetypes:video/mp4,video/quicktime,video/x-msvideo,video/webm',
                'max:512000',
            ],
        ]);

        $user    = $request->user();
        $channel = $user->channel;
        $file    = $request->file('video');

        $storedPath = $file->store('videos/original', 'local');

        $video = Video::create([
            'user_id'           => $user->id,
            'channel_id'        => $channel->id,
            'title'             => $request->title,
            'description'       => $request->description,
            'original_filename' => $file->getClientOriginalName(),
            'path'              => $storedPath,
            'file_size'         => $file->getSize(),
            'mime_type'         => $file->getMimeType(),
            'status'            => 'uploading',
            'visibility'        => $request->visibility ?? 'public',
        ]);

        if ($request->filled('tags')) {
            $tagIds = collect($request->tags)->map(function ($name) {
                return Tag::firstOrCreate(
                    ['slug' => Str::slug($name)],
                    ['name' => $name]
                )->id;
            });
            $video->tags()->sync($tagIds);
        }

        ProcessVideoJob::dispatch($video);

        return response()->json([
            'message' => 'アップロードしました。処理中です。',
            'video'   => $video,
        ], 201);
    }

    /**
     * チャンクストリーミング（Range リクエスト対応）
     * GET /api/videos/{video}/stream
     *
     * 開発環境・本番環境どちらでも動作する汎用ストリーミング
     * Rangeヘッダーに対応しシーク操作を高速化する
     */
    public function stream(Request $request, Video $video): StreamedResponse
    {
        if ($video->status !== 'ready') {
            abort(404, 'この動画はまだ処理中です。');
        }

        $path = Storage::disk('local')->path($video->path);
        abort_unless(file_exists($path), 404);

        $fileSize = filesize($path);
        $mimeType = $video->mime_type ?? 'video/mp4';

        // Rangeヘッダーの解析
        $rangeHeader = $request->header('Range');

        if ($rangeHeader) {
            // Range: bytes=START-END 形式をパース
            preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $matches);
            $start = (int) $matches[1];
            $end   = isset($matches[2]) && $matches[2] !== ''
                ? (int) $matches[2]
                : $fileSize - 1;

            // チャンクサイズ（2MB）
            $chunkSize = 2 * 1024 * 1024;
            $end       = min($end, $start + $chunkSize - 1, $fileSize - 1);
            $length    = $end - $start + 1;

            return response()->stream(
                function () use ($path, $start, $length) {
                    $fp = fopen($path, 'rb');
                    fseek($fp, $start);
                    $remaining = $length;
                    while (!feof($fp) && $remaining > 0) {
                        $read = min(8192, $remaining);
                        echo fread($fp, $read);
                        $remaining -= $read;
                        flush();
                    }
                    fclose($fp);
                },
                206, // Partial Content
                [
                    'Content-Type'    => $mimeType,
                    'Content-Range'   => "bytes {$start}-{$end}/{$fileSize}",
                    'Content-Length'  => $length,
                    'Accept-Ranges'   => 'bytes',
                    'Cache-Control'   => 'no-cache',
                ]
            );
        }

        // Rangeなしの場合はファイル全体を返す
        return response()->stream(
            function () use ($path) {
                $fp = fopen($path, 'rb');
                while (!feof($fp)) {
                    echo fread($fp, 8192);
                    flush();
                }
                fclose($fp);
            },
            200,
            [
                'Content-Type'   => $mimeType,
                'Content-Length' => $fileSize,
                'Accept-Ranges'  => 'bytes',
                'Cache-Control'  => 'no-cache',
            ]
        );
    }

    /**
     * HLS プレイリスト配信
     * GET /api/videos/{video}/hls/playlist.m3u8
     *
     * FFmpegでトランスコード済みの場合のみ利用可能
     * セグメントファイル（.ts）も同じエンドポイントで配信
     */
    public function hlsPlaylist(Video $video): StreamedResponse
    {
        if ($video->status !== 'ready') abort(404);

        $playlistPath = Storage::disk('local')->path(
            'videos/hls/' . $video->id . '/playlist.m3u8'
        );
        abort_unless(file_exists($playlistPath), 404, 'HLSプレイリストが存在しません。');

        return response()->stream(
            function () use ($playlistPath) {
                echo file_get_contents($playlistPath);
            },
            200,
            [
                'Content-Type'  => 'application/vnd.apple.mpegurl',
                'Cache-Control' => 'no-cache',
            ]
        );
    }

    /**
     * HLS セグメント配信
     * GET /api/videos/{video}/hls/{segment}
     */
    public function hlsSegment(Video $video, string $segment): StreamedResponse
    {
        if ($video->status !== 'ready') abort(404);

        // セグメントファイル名のバリデーション（パストラバーサル対策）
        abort_unless(preg_match('/^[\w\-]+\.ts$/', $segment), 400);

        $segmentPath = Storage::disk('local')->path(
            'videos/hls/' . $video->id . '/' . $segment
        );
        abort_unless(file_exists($segmentPath), 404);

        return response()->stream(
            function () use ($segmentPath) {
                $fp = fopen($segmentPath, 'rb');
                while (!feof($fp)) {
                    echo fread($fp, 8192);
                    flush();
                }
                fclose($fp);
            },
            200,
            [
                'Content-Type'  => 'video/MP2T',
                'Cache-Control' => 'public, max-age=3600',
            ]
        );
    }

    /**
     * 動画削除
     * DELETE /api/videos/{video}
     */
    public function destroy(Request $request, Video $video): JsonResponse
    {
        if ($video->user_id !== $request->user()->id) {
            abort(403, '削除権限がありません。');
        }

        Storage::disk('local')->delete($video->path);
        if ($video->thumbnail) {
            Storage::disk('local')->delete($video->thumbnail);
        }
        // HLSセグメントも削除
        Storage::disk('local')->deleteDirectory('videos/hls/' . $video->id);

        $video->delete();

        return response()->json(['message' => '動画を削除しました。']);
    }
}
