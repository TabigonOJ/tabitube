<?php

namespace App\Jobs;

use App\Models\Video;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessVideoJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 3600;

    public function __construct(public Video $video) {}

    public function handle(): void
    {
        $this->video->update(['status' => 'processing']);

        try {
            // FFmpegなしでそのままreadyに（開発用）
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
}
