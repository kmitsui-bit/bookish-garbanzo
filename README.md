# アポイント通知システム MVP

営業向けの「アポイント登録・一覧管理・LINE通知」Webアプリです。スマホから素早く登録でき、一覧・詳細で管理でき、Form送信直後通知と TEL 5分前通知を LINE グループへ送れます。

## 画面構成

1. `新規登録画面`
   入力しやすさ優先のシンプルなフォーム。必須バリデーションは入力欄の近くに表示します。
2. `一覧画面`
   テーブル中心。スマホではカード表示も併用し、検索・日付絞り込み・TEL通知対象フィルタを提供します。
3. `詳細画面`
   全項目、通知状態、通知履歴をまとめて確認できます。
4. `編集画面`
   登録内容の修正に対応します。
5. `通知ログ画面`
   Form通知と TEL リマインド通知の成功/失敗を確認できます。ページネーション、絞り込み、手動再送、一括再送に対応します。
6. `CSV出力`
   一覧画面からそのまま CSV ダウンロードできます。
7. `設定画面`
   実運用で必要な LINE グループ ID を更新できます。タイムゾーンは日本時間固定です。
8. `接続チェック`
   設定画面から LINE API 認証やモックモード状態を確認できます。
9. `Webhook受信`
   LINE グループから `groupId` を受け取り、自動で設定へ反映できます。

## 情報設計

- 中心エンティティは `appointments`
- 送信結果は `notification_logs` に履歴として保持
- LINE グループ設定やタイムゾーンは `app_settings` で管理
- 将来の `users` `organizations` `audit_logs` を追加しやすいよう、通知や設定を分離

## データモデル

主なテーブルは以下です。

- `appointments`
  - アポイント本体
  - `selfCall` と `telReminderEnabled` を分離し、将来の通知停止理由追加にも対応しやすくしています
- `notification_logs`
  - `form_submitted` / `tel_reminder` の送信結果を保存
  - ペイロード、送信先、エラー内容も保持
- `app_settings`
  - LINE グループ ID とタイムゾーンを保持

詳細は [prisma/schema.prisma](/Users/mitsuikoshiro/CodeX/アポ通知システム/prisma/schema.prisma) を参照してください。

## 通知フロー

### 1. Form送信直後通知

1. フォーム送信
2. アポイント保存
3. LINE 通知サービス呼び出し
4. 成功/失敗を `notification_logs` に記録
5. 通知失敗でもアポイント登録は保持

### 2. TELリマインド通知

1. 定期ジョブが `/api/jobs/tel-reminders` を呼ぶ
2. 現在時刻の約5分後の `telAt` を持つ案件を抽出
3. `selfCall = false` かつ `telReminderSentAt = null` の案件のみ送信
4. 成功時に送信済み記録と `telReminderSentAt` を更新

## バリデーション設計

- `zod` でクライアントと API で共通ルールを使用
- `mm/dd HH:mm` 形式は [src/lib/date.ts](/Users/mitsuikoshiro/CodeX/アポ通知システム/src/lib/date.ts) でパース
- 年齢は数字のみ
- 名前はカタカナのみ
- 電話番号は数字のみ
- 必須入力不足は送信不可

## スケジューラ設計

- エンドポイント: `POST /api/jobs/tel-reminders`
- 認可: `Authorization: Bearer $CRON_SECRET`
- 実行頻度: 毎分または2分ごと推奨
- 検索窓: 現在時刻の `+4分` から `+6分`
  - ジョブの多少のズレに強くするため

## LINE連携設計

- 通知送信は [src/lib/notifications.ts](/Users/mitsuikoshiro/CodeX/アポ通知システム/src/lib/notifications.ts) に集約
- `LINE_MOCK_MODE=true` なら実送信せずコンソールログのみ
- 実運用では Messaging API の Push Message を使用
- チャネルアクセストークンとグループIDは環境変数で管理
- 運用中の LINE グループ ID は設定画面から更新可能
- タイムゾーンは `Asia/Tokyo` 固定
- 通知ログと詳細画面から手動再送可能
- 設定画面から `LINE接続チェック` を実行可能
- 通知ログ画面で失敗ログのみ一括再送可能
- Webhook URL は `/api/line/webhook`

## スマホ / PC UI方針

- 白基調、業務SaaS風、余白広め
- スマホではフォームを縦積み、CTA は幅広ボタン
- 一覧は PC でテーブル、スマホではカードを併用
- 詳細は縦に情報を整理し、通知履歴は読み返しやすく表示

## セットアップ

Node.js 20 以上を用意してください。

### 1. Supabase プロジェクトを作成

1. Supabase で新規 project を作成
2. `Project Settings > Database` で接続情報を確認
3. 以下の2つを控える
   - `DATABASE_URL`
     - Transaction pooler の URL を推奨
   - `DIRECT_URL`
     - Direct connection の URL

`.env` 例:

```env
DATABASE_URL="postgresql://postgres:password@db.xxxxxxxxxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:password@db.xxxxxxxxxxxx.supabase.co:5432/postgres"
APP_BASE_URL="http://localhost:3000"
APP_TIMEZONE="Asia/Tokyo"
LINE_CHANNEL_ACCESS_TOKEN=""
LINE_CHANNEL_SECRET=""
LINE_GROUP_ID=""
LINE_MOCK_MODE="true"
CRON_SECRET="change-me"
```

### 2. ローカル起動

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:dbpush
npm run seed
npm run dev
```

## Netlifyデプロイ

Netlify は公式に Next.js App Router と Route Handlers をサポートしています。既存の Git リポジトリを Netlify に接続してデプロイできます。Netlify の公式ドキュメントでは、既存の Next.js アプリは Git プロバイダに push して Netlify Dashboard から接続する流れが案内されています。  
Sources:
- Netlify Docs: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
- Netlify Docs: https://docs.netlify.com/build/environment-variables/get-started/

### Netlify側で設定するもの

Netlify の `Project configuration > Environment variables` に以下を登録してください。

```env
DATABASE_URL=SupabaseのTransaction pooler URL
DIRECT_URL=SupabaseのDirect connection URL
APP_BASE_URL=https://あなたのNetlifyドメイン
APP_TIMEZONE=Asia/Tokyo
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
LINE_GROUP_ID=
LINE_MOCK_MODE=false
CRON_SECRET=任意の長い文字列
```

### デプロイ後の流れ

1. Netlify の公開URLでアプリを開く
2. `設定` 画面で表示される Webhook URL を LINE Developers に設定する
3. Bot を既存の LINE グループへ追加する
4. グループで1回発言して `groupId` を自動取得する
5. `設定` 画面で `LINEグループID` が入ったことを確認する

### Supabase を使う理由

- Netlify 本番では SQLite ファイルを安定して永続化できません
- `appointments` の保存や通知ログの保持には永続DBが必要です
- そのため、本番運用は Supabase/Postgres 前提にしてください

## サンプルデータ

以下で投入できます。

```bash
npm run seed
```

## CSV出力

一覧画面右上の `CSV出力` ボタン、または以下の API からダウンロードできます。

```bash
curl -L http://localhost:3000/api/appointments/export -o appointments.csv
```

## ローカルでのモック通知

`.env` に以下を設定します。

```env
LINE_MOCK_MODE=true
```

この場合、LINE 送信は行わずサーバーログへ出力します。

## LINE連携設定手順

1. LINE Developers で Messaging API チャネルを作成
2. Bot を LINE グループへ追加
3. Webhook URL に `https://あなたの公開URL/api/line/webhook` を設定
4. グループで1回発言して `groupId` をWebhookで取得
5. 設定画面に自動反映された `LINEグループID` を確認
4. `LINE_CHANNEL_ACCESS_TOKEN` と `LINE_CHANNEL_SECRET` を `.env` に設定
5. `LINE_MOCK_MODE=false` に変更

## Supabase 初期化メモ

初回だけ以下を実行してください。

```bash
npm run prisma:generate
npm run prisma:dbpush
npm run seed
```

Netlify ではビルド時に `prisma db push` を実行する設定にしています。`DATABASE_URL` と `DIRECT_URL` が正しく入っていれば、テーブルは自動反映されます。

## Cron 実行例

ローカル確認:

```bash
curl -X POST http://localhost:3000/api/jobs/tel-reminders \
  -H "Authorization: Bearer change-me"
```

本番では Vercel Cron や GitHub Actions、外部 Cron から毎分叩く構成を想定しています。

## テスト

```bash
npm run test
```

現在は以下のテストを同梱しています。

- 日時パース
- 入力バリデーション
- 通知文面整形
- TELリマインド対象判定
- CSV整形
- 通知ログ絞り込み
- 通知ログページネーション/一括再送ヘルパー

まとめて検証する場合は以下を実行してください。

```bash
npm run verify
```

## 今後の拡張案

- ステータス管理
- 担当営業の紐付け
- ログイン機能と権限制御
- 顧客管理システム連携
- CSV 出力
- 通知先複数対応
- 年跨ぎ時の自動補正ルール強化
