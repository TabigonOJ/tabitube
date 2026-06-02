<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('channels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('handle')->unique()->comment('@ハンドル名 例: @myChannel');
            $table->text('description')->nullable();
            $table->string('banner')->nullable()->comment('チャンネルバナー画像パス');
            $table->unsignedBigInteger('subscriber_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('channels');
    }
};
