<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChannelController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\VideoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| 認証不要
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::get('/videos',                          [VideoController::class, 'index']);
Route::get('/videos/{video}',                  [VideoController::class, 'show']);
Route::get('/videos/{video}/stream',           [VideoController::class, 'stream']);
Route::get('/videos/{video}/hls/playlist.m3u8',[VideoController::class, 'hlsPlaylist']);
Route::get('/videos/{video}/hls/{segment}',    [VideoController::class, 'hlsSegment']);
Route::get('/videos/{video}/comments',         [CommentController::class, 'index']);

Route::get('/channels/{channel}',              [ChannelController::class, 'show']);
Route::get('/channels/{channel}/videos',       [ChannelController::class, 'videos']);

/*
|--------------------------------------------------------------------------
| 認証必須
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout',    [AuthController::class, 'logout']);
    Route::get('/me',         [AuthController::class, 'me']);
    Route::get('/my-channel', [ChannelController::class, 'myChannel']);

    Route::post('/videos',           [VideoController::class, 'store']);
    Route::delete('/videos/{video}', [VideoController::class, 'destroy']);

    Route::post('/videos/{video}/comments',      [CommentController::class, 'store']);
    Route::delete('/comments/{comment}',         [CommentController::class, 'destroy']);

    Route::post('/videos/{video}/like',          [LikeController::class, 'toggleVideo']);
    Route::post('/comments/{comment}/like',      [LikeController::class, 'toggleComment']);

    Route::post('/channels/{channel}/subscribe', [ChannelController::class, 'subscribe']);
});
