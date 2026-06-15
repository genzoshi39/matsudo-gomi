# 松戸市古ケ崎 ごみ出し通知

GitHub Pagesで公開するための静的サイトです。

## ファイル

- `index.html`: ごみ出し通知Webアプリ
- `matsudo-gomi-schedule.json`: Alexa Skillが読む収集ルール

## 公開手順

1. GitHubで新しいリポジトリを作成します。
   - 例: `matsudo-gomi`
   - PublicでもPrivateでも構いません。GitHub Pagesを無料で使うならPublicが簡単です。
2. このフォルダの中身をリポジトリ直下にアップロードします。
3. GitHubのリポジトリ画面で `Settings` → `Pages` を開きます。
4. `Build and deployment` の `Source` を `Deploy from a branch` にします。
5. Branchを `main`、Folderを `/root` にして保存します。
6. 数十秒から数分待つと、Pages URLが表示されます。

URLはこの形になります。

```text
https://YOUR_GITHUB_USER.github.io/matsudo-gomi/
```

Alexa用JSONはこのURLです。

```text
https://YOUR_GITHUB_USER.github.io/matsudo-gomi/matsudo-gomi-schedule.json
```

## Alexa側の設定

AWS Lambdaの環境変数 `SCHEDULE_URL` に、上のJSON URLを設定します。

```text
SCHEDULE_URL=https://YOUR_GITHUB_USER.github.io/matsudo-gomi/matsudo-gomi-schedule.json
```

## 日程を更新するとき

1. 公開されたWebアプリを開きます。
2. 収集ルールを修正します。
3. `Alexa連携JSON` を押して `matsudo-gomi-schedule.json` をダウンロードします。
4. GitHubで既存の `matsudo-gomi-schedule.json` を置き換えます。
5. Alexaに「今日のごみ」と聞いて確認します。

## 注意

初期日程は仮設定です。必ず松戸市の公式ごみ出しカレンダーで古ケ崎47周辺の収集日を確認してください。
