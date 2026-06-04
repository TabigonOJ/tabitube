# TabiTube セットアップガイド

## 事前に必要なもの

| ツール | 確認コマンド |
|---|---|
| PHP 8.2+ | `php -v` |
| Composer | `composer -V` |
| Node.js | `node -v` |
| MySQL (XAMPP) | XAMPPコントロールパネルからApache・MySQL起動 |
| FFmpeg | `ffmpeg -version` |
| g++ (MinGW) | `g++ --version` |

---

## 1. FFmpeg のインストール

1. https://www.gyan.dev/ffmpeg/builds/ を開く
2. `ffmpeg-release-essentials.zip` をダウンロード・解凍
3. フォルダごと `C:\ffmpeg\` に移動
4. 環境変数の `Path` に `C:\ffmpeg\bin` を追加
5. ターミナルを再起動して確認

```bash
ffmpeg -version
```

---

## 2. g++ (MinGW) のインストール

起動スクリプト `start.exe` のコンパイルに必要です。

1. https://winlibs.com/ を開く
2. 最新の `Win64` zip をダウンロード・解凍
3. `C:\mingw64\` に移動
4. 環境変数の `Path` に `C:\mingw64\bin` を追加
5. ターミナルを再起動して確認

```bash
g++ --version
```

---

## 3. start.exe のコンパイル

プロジェクトルート（`tabitube/`）で実行：

```bash
g++ -o start.exe start.cpp -luser32
```

以降は `start.exe` をダブルクリックするだけで全サーバーが起動します。

---

## 4. リポジトリ取得

```bash
git clone <リポジトリURL>
cd tabitube
```

---

## 5. データベース作成

1. `http://localhost/phpmyadmin` を開く
2. 「新規作成」→ データベース名 `tabitube` → 照合順序 `utf8mb4_unicode_ci` → 作成

---

## 6. バックエンドセットアップ

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

### .env を編集

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tabitube
DB_USERNAME=root
DB_PASSWORD=

QUEUE_CONNECTION=database
```

### マイグレーション実行

```bash
php artisan migrate
php artisan storage:link
```

---

## 7. フロントエンドセットアップ

```bash
cd ../frontend
npm install
```

---

## 8. 起動

### start.exe を使う場合（推奨）

プロジェクトルートの `start.exe` をダブルクリック。  
FFmpegが検出されると自動でHLSモードが有効になります。

### 手動で起動する場合（ターミナルを3つ開く）

**ターミナル 1 — Laravelサーバー**

```bash
cd backend
php artisan serve
```

**ターミナル 2 — キューワーカー（動画処理）**

```bash
cd backend
php artisan queue:work
```

**ターミナル 3 — Reactフロントエンド**

```bash
cd frontend
npm run dev
```

---

## 9. アクセス

| URL | 内容 |
|---|---|
| `http://localhost:5173` | フロントエンド |
| `http://localhost:8000` | Laravel API |
| `http://localhost/phpmyadmin` | phpMyAdmin |

---

## 注意事項

- `php artisan queue:work` は動画アップロード時にバックグラウンドで処理を行うため、常に起動しておく必要があります。
- FFmpegが検出された場合はHLSトランスコード（1080p / 720p / 480p）が有効になります。
- FFmpegが未検出の場合はチャンクストリーミングモードで動作します。
- アップロード可能な動画形式は MP4 / MOV / AVI / WebM で、最大500MBです。
