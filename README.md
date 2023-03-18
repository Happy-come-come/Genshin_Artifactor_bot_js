
# Genshin_Artifactor_bot_js
Genshin_ArtifactorをDiscord.jsでホストするためのコードです。

# 使い方

## 環境変数
環境変数にBOT_TOKENを設定しておいてください。

## index.js
```js
await client.application.commands.set(data, 'xxxxxxxxxxxxxxxxx');
```
の「xxxxxxxxxxxxxxxxx」にBOTを使いたいサーバーのサーバーIDを入れます。

## python周り
```bash
pip3 install Pillow
```
でOK。

## 起動方法
```bash
npm install
```
した後、
```bash
node index.js
```
で起動できると思います。

原神バージョンが上がるなどして、キャラや聖遺物、武器のデータ新規に追加された場合、
```bash
node asset_update.js
```
で画像を取ってくることができると思います。
# スペシャルサンクス
[[FuroBath](https://github.com/FuroBath) / **[ArtifacterImageGen](https://github.com/FuroBath/ArtifacterImageGen)**] 画像生成部分

[[yuko1101](https://github.com/yuko1101) / **[enka-network-api](https://github.com/yuko1101/enka-network-api)**] データ取得部分
