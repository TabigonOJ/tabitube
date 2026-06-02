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

class VideoController extends Controller
{
    /**
     * 動画一覧（公開済みのみ）
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

        // 再生数をインクリメント
        $video->increment('view_count');

        $video->load(['channel', 'tags', 'user']);

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
                'max:512000', // 500MB
            ],
        ]);

        $user    = $request->user();
        $channel = $user->channel;
        $file    = $request->file('video');

        // ファイルを保存
        $storedPath = $file->store('videos/original', 'local');

        // Videoレコード作成
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

        // タグの保存
        if ($request->filled('tags')) {
            $tagIds = collect($request->tags)->map(function ($name) {
                return Tag::firstOrCreate(
                    ['slug' => Str::slug($name)],
                    ['name' => $name]
                )->id;
            });
            $video->tags()->sync($tagIds);
        }

        // FFmpegトランスコードをキューに投入
        ProcessVideoJob::dispatch($video);

        return response()->json([
            'message' => 'アップロードしました。処理中です。',
            'video'   => $video,
        ], 201);
    }

    /**
     * 動画ストリーミング
     * GET /api/videos/{video}/stream
     */
    public function stream(Video $video): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        if ($video->status !== 'ready') {
            abort(404, 'この動画はまだ処理中です。');
        }

        $path = Storage::disk('local')->path($video->path);

        abort_unless(file_exists($path), 404);

        return response()->stream(function () use ($path) {
            $stream = fopen($path, 'rb');
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type'  => 'video/mp4',
            'Accept-Ranges' => 'bytes',
        ]);
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

        $video->delete();

        return response()->json(['message' => '動画を削除しました。']);
    }
}
