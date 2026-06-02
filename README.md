# Tabitube

## 概要

このリポジトリは Laravel バックエンドと React/Vite フロントエンドを持つ動画共有アプリです。GitHub に公開するためのインストール手順を以下にまとめています。

---

## 前提条件

- Windows + XAMPP
- PHP 8.x
- Composer
- Node.js / npm
- MySQL (XAMPP の MySQL を使用)

### XAMPP の `php.ini` 設定

`php.ini` で以下の値を設定してください。

```ini
upload_max_filesize = 512M
post_max_size = 512M
```

> 変更後は Apache を再起動してください。

---

## 1. バックエンドの準備

1. `backend` フォルダに移動

```powershell
cd backend
```

2. Composer 依存関係をインストール

```powershell
composer install
```

3. 環境ファイルをコピーして編集

```powershell
copy .env.example .env
```

4. `.env` の主な設定

- `APP_NAME=Tabitube`
- `APP_ENV=local`
- `APP_URL=http://localhost`
- `DB_CONNECTION=mysql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_DATABASE=tabitube`
- `DB_USERNAME=root`
- `DB_PASSWORD=`
- `FILESYSTEM_DISK=local`
- `QUEUE_CONNECTION=database`
- `SESSION_DRIVER=database`

> XAMPP の MySQL を使う場合、`DB_USERNAME` と `DB_PASSWORD` は XAMPP の設定に合わせてください。

5. アプリケーションキーを生成

```powershell
php artisan key:generate
```

6. データベースマイグレーションを実行

```powershell
php artisan migrate
```

7. ストレージの公開リンク作成

```powershell
php artisan storage:link
```

8. ローカルサーバー起動

```powershell
php artisan serve
```

バックエンドは通常 `http://127.0.0.1:8000` で起動します。

---

## 2. フロントエンドの準備

1. `frontend` フォルダに移動

```powershell
cd ..\frontend
```

2. Node 依存関係をインストール

```powershell
npm install
```

3. 開発サーバーを起動

```powershell
npm run dev
```

フロントエンドは通常 `http://localhost:5173` で起動します。

---

## 3. 動作確認

- バックエンド API: `http://localhost:8000/api/videos`
- フロントエンド: `http://localhost:5173`

`http://localhost:5173` から `http://localhost:8000/api` にアクセスするため、バックエンド側では CORS 設定が必要です。現在の設定では `http://localhost:5173` が許可されています。

---

## 4. 補足

### MySQL データベース作成

XAMPP の MySQL を使う場合、データベース `tabitube` を手動で作成しておく必要があります。

```sql
CREATE DATABASE tabitube CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 失敗ジョブテーブルやセッションテーブルが必要な場合

環境によっては以下コマンドも実行してください。

```powershell
php artisan queue:table
php artisan session:table
php artisan migrate
```

### 注意

- `php.ini` の `upload_max_filesize` と `post_max_size` を 512M に設定後、Apache を再起動すること
- `.env` ファイルは Git にコミットしないこと

---

## 5. まとめ

```
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve

cd ..\frontend
npm install
npm run dev
```

この手順を README に追加すれば、GitHub からクローンしたときにセットアップしやすくなります。