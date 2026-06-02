<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique()->comment('URLフレンドリーなタグ名');
            $table->unsignedBigInteger('video_count')->default(0);
            $table->timestamps();
        });

        Schema::create('video_tag', function (Blueprint $table) {
            $table->foreignId('video_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->primary(['video_id', 'tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_tag');
        Schema::dropIfExists('tags');
    }
};
