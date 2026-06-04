<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Video;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    /**
     * 動画いいねトグル
     * POST /api/videos/{video}/like
     */
    public function toggleVideo(Request $request, Video $video): JsonResponse
    {
        return $this->toggle($request->user(), $video, 'like_count');
    }

    /**
     * コメントいいねトグル
     * POST /api/comments/{comment}/like
     */
    public function toggleComment(Request $request, Comment $comment): JsonResponse
    {
        return $this->toggle($request->user(), $comment, 'like_count');
    }

    private function toggle($user, $model, string $countColumn): JsonResponse
    {
        $existing = Like::where('user_id', $user->id)
            ->where('likeable_id', $model->id)
            ->where('likeable_type', get_class($model))
            ->first();

        if ($existing) {
            $existing->delete();
            $model->decrement($countColumn);
            $liked = false;
        } else {
            Like::create([
                'user_id'       => $user->id,
                'likeable_id'   => $model->id,
                'likeable_type' => get_class($model),
            ]);
            $model->increment($countColumn);
            $liked = true;
        }

        return response()->json([
            'liked'      => $liked,
            'like_count' => $model->fresh()->{$countColumn},
        ]);
    }
}
