<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\VideoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| 認証不要
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// 動画一覧・詳細・ストリーミングは未ログインでも見られる
Route::get('/videos',              [VideoController::class, 'index']);
Route::get('/videos/{video}',      [VideoController::class, 'show']);
Route::get('/videos/{video}/stream', [VideoController::class, 'stream']);

/*
|--------------------------------------------------------------------------
| 認証必須
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // 動画アップロード・削除
    Route::post('/videos',           [VideoController::class, 'store']);
    Route::delete('/videos/{video}', [VideoController::class, 'destroy']);
});
