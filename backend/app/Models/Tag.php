<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    protected $fillable = ['name', 'slug', 'video_count'];

    public function videos()
    {
        return $this->belongsToMany(Video::class, 'video_tag');
    }
}
