<?php

namespace App\Jobs;

use App\Models\Video;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessVideoJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 3600;

    public function __construct(public Video $video) {}

    public function handle(): void
    {
        $this->video->update(['status' => 'processing']);

        $inputPath = Storage::disk('local')->path($this->video->path);
        $hlsDir    = Storage::disk('local')->path('videos/hls/' . $this->video->id);

        try {
            // FFmpegが使えるか確認
            exec('ffmpeg -version 2>&1', $output, $code);
            $ffmpegAvailable = ($code === 0);

            if ($ffmpegAvailable) {
                $this->transcodeWithHLS($inputPath, $hlsDir);
            } else {
                // FFmpegなし→チャンクストリーミングのみ（開発環境用）
                Log::info('FFmpeg未検出。チャンクストリーミングモードで続行。', [
                    'video_id' => $this->video->id,
                ]);
            }

            $this->video->update([
                'status'       => 'ready',
                'published_at' => now(),
            ]);

        } catch (\Throwable $e) {
            Log::error('動画処理失敗: ' . $e->getMessage(), [
                'video_id' => $this->video->id,
            ]);
            $this->video->update(['status' => 'failed']);
            $this->fail($e);
        }
    }

    /**
     * FFmpegでHLSトランスコード
     * 品質: 1080p / 720p / 480p の3段階
     */
    private function transcodeWithHLS(string $inputPath, string $hlsDir): void
    {
        if (!is_dir($hlsDir)) {
            mkdir($hlsDir, 0755, true);
        }

        $playlistPath = $hlsDir . '/playlist.m3u8';

        // HLS変換コマンド（品質切り替え対応・マルチビットレート）
        $cmd = implode(' ', [
            'ffmpeg',
            '-i', escapeshellarg($inputPath),
            '-filter_complex',
            escapeshellarg(
                '[v:0]split=3[v1][v2][v3];' .
                '[v1]scale=w=1920:h=1080[v1out];' .
                '[v2]scale=w=1280:h=720[v2out];' .
                '[v3]scale=w=854:h=480[v3out]'
            ),
            // 1080p
            '-map [v1out] -map a:0 -c:v libx264 -b:v 5000k -maxrate 5350k -bufsize 7500k -c:a aac -b:a 192k',
            // 720p
            '-map [v2out] -map a:0 -c:v libx264 -b:v 2800k -maxrate 2996k -bufsize 4200k -c:a aac -b:a 128k',
            // 480p
            '-map [v3out] -map a:0 -c:v libx264 -b:v 1400k -maxrate 1498k -bufsize 2100k -c:a aac -b:a 96k',
            '-f hls',
            '-hls_time 6',                    // 6秒ごとにセグメント分割
            '-hls_playlist_type vod',
            '-hls_flags independent_segments',
            '-master_pl_name playlist.m3u8',
            '-var_stream_map', escapeshellarg('v:0,a:0 v:1,a:1 v:2,a:2'),
            '-hls_segment_filename', escapeshellarg($hlsDir . '/stream_%v_%03d.ts'),
            escapeshellarg($hlsDir . '/stream_%v.m3u8'),
            '2>&1',
        ]);

        exec($cmd, $output, $code);

        if ($code !== 0) {
            throw new \RuntimeException('FFmpeg HLS変換失敗: ' . implode("\n", $output));
        }

        Log::info('HLSトランスコード完了', ['video_id' => $this->video->id]);
    }
}
