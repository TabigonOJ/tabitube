<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Video;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    /**
     * 動画のコメント一覧
     * GET /api/videos/{video}/comments
     */
    public function index(Video $video): JsonResponse
    {
        $comments = $video->comments()
            ->whereNull('parent_id')
            ->with(['user', 'replies.user'])
            ->latest()
            ->paginate(20);

        return response()->json($comments);
    }

    /**
     * コメント投稿
     * POST /api/videos/{video}/comments
     */
    public function store(Request $request, Video $video): JsonResponse
    {
        $request->validate([
            'body'      => ['required', 'string', 'max:1000'],
            'parent_id' => ['nullable', 'exists:comments,id'],
        ]);

        $comment = Comment::create([
            'user_id'   => $request->user()->id,
            'video_id'  => $video->id,
            'parent_id' => $request->parent_id,
            'body'      => $request->body,
        ]);

        // 動画のコメント数をインクリメント
        $video->increment('comment_count');

        $comment->load('user');

        return response()->json($comment, 201);
    }

    /**
     * コメント削除
     * DELETE /api/comments/{comment}
     */
    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        if ($comment->user_id !== $request->user()->id) {
            abort(403, '削除権限がありません。');
        }

        $comment->video->decrement('comment_count');
        $comment->delete();

        return response()->json(['message' => 'コメントを削除しました。']);
    }
}
