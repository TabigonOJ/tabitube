<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChannelController extends Controller
{
    /**
     * チャンネル詳細
     * GET /api/channels/{channel}
     */
    public function show(Request $request, Channel $channel): JsonResponse
    {
        $channel->load('user');

        // ログイン中ならサブスク状態も返す
        $subscribed = false;
        if ($request->user()) {
            $subscribed = Subscription::where('user_id', $request->user()->id)
                ->where('channel_id', $channel->id)
                ->exists();
        }

        return response()->json([
            'channel'    => $channel,
            'subscribed' => $subscribed,
        ]);
    }

    /**
     * チャンネルの動画一覧
     * GET /api/channels/{channel}/videos
     */
    public function videos(Channel $channel): JsonResponse
    {
        $videos = $channel->videos()
            ->published()
            ->with(['tags'])
            ->latest('published_at')
            ->paginate(20);

        return response()->json($videos);
    }

    /**
     * チャンネル登録トグル
     * POST /api/channels/{channel}/subscribe
     */
    public function subscribe(Request $request, Channel $channel): JsonResponse
    {
        $user = $request->user();

        // 自分のチャンネルには登録できない
        if ($channel->user_id === $user->id) {
            abort(422, '自分のチャンネルには登録できません。');
        }

        $existing = Subscription::where('user_id', $user->id)
            ->where('channel_id', $channel->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $channel->decrement('subscriber_count');
            $subscribed = false;
        } else {
            Subscription::create([
                'user_id'    => $user->id,
                'channel_id' => $channel->id,
            ]);
            $channel->increment('subscriber_count');
            $subscribed = true;
        }

        return response()->json([
            'subscribed'       => $subscribed,
            'subscriber_count' => $channel->fresh()->subscriber_count,
        ]);
    }

    /**
     * 自分のチャンネル情報
     * GET /api/my-channel
     */
    public function myChannel(Request $request): JsonResponse
    {
        $channel = $request->user()->channel;
        abort_unless($channel, 404, 'チャンネルが見つかりません。');
        return response()->json($channel);
    }
}
