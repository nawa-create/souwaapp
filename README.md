# 残業時間・手当集計システム

ドライバーの残業時間と各種手当を管理・集計するWebアプリケーションです。

## 技術スタック

- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS
- **データベース**: Supabase (PostgreSQL)
- **ホスティング**: Vercel
- **PDF生成**: jspdf + jspdf-autotable

## 機能

1. **日別入力** - 日次の勤怠・残業時間入力
2. **勤務履歴** - 過去の勤務記録閲覧（タイムライン表示）
3. **月別入力** - 電話手当・売上・無事故手当の入力
4. **月次集計** - 月次レポート生成・PDF出力
5. **車泊集計** - 車泊手当の集計
6. **ドライバー管理** - ドライバーマスター管理
7. **残業単価管理** - 残業単価設定
8. **手当単価管理** - 手当単価設定

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/souwazangyoapp.git
cd souwazangyoapp
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、Supabaseの認証情報を設定します。

```bash
cp .env.example .env
```

`.env` ファイルを編集:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Supabaseデータベースのセットアップ

`supabase/migrations/` フォルダ内のSQLファイルを順番に実行してテーブルを作成します。

### 5. 開発サーバーの起動

```bash
npm run dev
```

## Vercelへのデプロイ

### 方法1: Vercel CLI

```bash
npm i -g vercel
vercel
```

### 方法2: GitHub連携

1. GitHubにリポジトリをプッシュ
2. [Vercel](https://vercel.com) にログイン
3. "New Project" → GitHubリポジトリを選択
4. 環境変数を設定:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. "Deploy" をクリック

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `VITE_SUPABASE_URL` | SupabaseプロジェクトのURL |
| `VITE_SUPABASE_ANON_KEY` | Supabaseの匿名キー |

## ライセンス

Private
