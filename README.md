# eBay商品詳細 Markdown エクスポーター

ebay商品ページから商品詳細を抽出し、Markdown形式でエクスポートするFirefox拡張機能です。

## 機能

- eBay商品ページの詳細情報を自動抽出
- Markdown形式でフォーマット
- ファイルとしてダウンロード
- 商品画像URL、価格、説明文等を含む

## インストール

1. 拡張機能をダウンロード
2. Firefoxの `about:debugging` を開く
3. 「このFirefox」→「一時的なアドオンを読み込む」
4. `manifest.json` を選択

## 使用方法

1. eBay商品ページを開く
2. 拡張機能アイコンをクリック
3. 「MDエクスポート」ボタンをクリック
4. Markdownファイルがダウンロードされます

## 開発

```bash
git clone https://github.com/Rioto3/ebay-md-exporter.git
cd ebay-md-exporter
```

## ライセンス

MIT License
