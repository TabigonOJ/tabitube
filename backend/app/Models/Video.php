<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Video extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'channel_id',
        'title',
        'description',
        'original_filename',
        'path',
        'thumbnail',
        'duration',
        'file_size',
        'mime_type',
        'status',
        'visibility',
        'view_count',
        'like_count',
        'comment_count',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function channel()
    {
        return $this->belongsTo(Channel::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'video_tag');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function likes()
    {
        return $this->morphMany(Like::class, 'likeable');
    }

    // 公開済み動画のみ取得するスコープ
    public function scopePublished($query)
    {
        return $query->where('status', 'ready')
                     ->where('visibility', 'public');
    }
}
