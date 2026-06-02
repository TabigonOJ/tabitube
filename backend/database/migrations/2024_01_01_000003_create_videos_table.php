<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('channel_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('original_filename')->comment('元のファイル名');
            $table->string('path')->comment('保存パス storage/app/videos/');
            $table->string('thumbnail')->nullable()->comment('サムネイル画像パス');
            $table->unsignedInteger('duration')->nullable()->comment('動画の長さ（秒）');
            $table->unsignedBigInteger('file_size')->nullable()->comment('ファイルサイズ（バイト）');
            $table->string('mime_type')->nullable();
            $table->enum('status', [
                'uploading',    // アップロード中
                'processing',   // FFmpegトランスコード中
                'ready',        // 視聴可能
                'failed',       // 処理失敗
            ])->default('uploading');
            $table->enum('visibility', [
                'public',       // 公開
                'unlisted',     // 限定公開
                'private',      // 非公開
            ])->default('public');
            $table->unsignedBigInteger('view_count')->default(0);
            $table->unsignedBigInteger('like_count')->default(0);
            $table->unsignedBigInteger('comment_count')->default(0);
            $table->timestamp('published_at')->nullable()->comment('公開日時');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['channel_id', 'status', 'visibility']);
            $table->index('published_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
