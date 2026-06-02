<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // チャンネル登録
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete()
                ->comment('登録したユーザー');
            $table->foreignId('channel_id')->constrained()->cascadeOnDelete()
                ->comment('登録されたチャンネル');
            $table->boolean('notify')->default(true)->comment('通知ON/OFF');
            $table->timestamps();

            $table->unique(['user_id', 'channel_id']);
        });

        // 視聴履歴（おすすめ機能・続きから再生のベース）
        Schema::create('view_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('video_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('watched_seconds')->default(0)
                ->comment('どこまで視聴したか（秒）');
            $table->timestamp('last_watched_at');
            $table->timestamps();

            $table->unique(['user_id', 'video_id']);
            $table->index('last_watched_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('view_histories');
        Schema::dropIfExists('subscriptions');
    }
};
