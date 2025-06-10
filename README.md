# eBay商品詳細 Markdown エクスポーター

eBay商品ページから商品詳細を抽出し、Markdown形式でエクスポートするFirefox拡張機能です。

## ✨ 機能

- **自動データ抽出**: eBay商品ページの詳細情報を自動で抽出
- **Markdown出力**: 構造化されたMarkdown形式でフォーマット
- **カスタマイズ可能**: 画像、説明文、配送情報の含有/除外が選択可能
- **高解像度画像**: 商品画像は高解像度版(1600px)で出力
- **多言語対応**: 日本版・米国版eBayに対応
- **右クリックメニュー**: ページ上で右クリックから直接エクスポート

## 🎯 対応サイト

- eBay.com (米国版)
- eBay.co.jp (日本版)

## 📦 インストール

### 開発版（手動インストール）

1. このリポジトリをクローンまたはダウンロード
```bash
git clone https://github.com/Rioto3/ebay-md-exporter.git
cd ebay-md-exporter
```

2. Firefoxで `about:debugging` を開く

3. 「このFirefox」→「一時的なアドオンを読み込む」をクリック

4. `manifest.json` ファイルを選択

5. 拡張機能が読み込まれ、ツールバーにアイコンが表示されます

## 🔧 使用方法

### 基本的な使い方

1. eBay商品ページを開く
2. 拡張機能アイコンをクリック
3. 「MDエクスポート」ボタンをクリック
4. プレビューを確認後、「ダウンロード」ボタンでファイル保存

### 右クリックメニューから

1. eBay商品ページ上で右クリック
2. 「eBay商品をMarkdownでエクスポート」を選択
3. 自動的にダウンロードが開始

### エクスポートオプション

- **画像URLを含める**: 商品画像のURLをMarkdownに含める
- **商品説明を含める**: 商品説明文を含める
- **配送情報を含める**: 配送料・配送予定を含める

## 📄 出力例

```markdown
# Famicom Mini Super Mario Bros Nintendo GBA CIB Japan

## 基本情報
- **商品ID**: 336004042747
- **状態**: Like New
- **入札**: 0 bids
- **残り時間**: 6d 12h
- **URL**: https://www.ebay.com/itm/336004042747

## 価格情報
- **価格**: US $0.99
- **参考価格**: JPY 143

## 商品説明
⚙️ RARE Famicom Mini Super Mario Bros Complete! Tested and working perfectly. Beautiful condition...

## 出品者情報
- **出品者**: famibank
- **評価**: 100% positive
- **所在地**: Sendai, Miyagi, Japan

## 配送・返品
- **配送料**: US $11.45 (約 JPY 1,659) Economy International Shipping
- **配送予定**: Estimated between Fri, Jul 11 and Tue, Aug 12
- **返品**: Seller does not accept returns

## 支払い方法
PayPal, Google Pay, Visa, JCB, Master Card, Discover, Diners Club

## 商品画像
![商品画像 1](https://i.ebayimg.com/images/g/gbgAAOSw5nhoRk3u/s-l1600.jpg)
![商品画像 2](https://i.ebayimg.com/images/g/~-QAAOSwDdZoRk3w/s-l1600.jpg)
...

---
*Exported by eBay MD Exporter*
*Generated: 2025/6/10 15:30:45*
```

## 🧪 テスト

### テスト用URL

以下のeBayページでテストできます：

**米国版eBay**
- https://www.ebay.com/itm/336004042747 (ゲームボーイアドバンス)
- https://www.ebay.com/itm/任意の商品番号

**日本版eBay**
- https://www.ebay.co.jp/itm/任意の商品番号

### 動作確認項目

- [ ] eBay商品ページでアイコンに✓マークが表示される
- [ ] ポップアップでページ情報が正しく表示される
- [ ] 「MDエクスポート」ボタンが有効になる
- [ ] プレビューにMarkdownが正しく表示される
- [ ] ダウンロードが正常に実行される
- [ ] 右クリックメニューからのエクスポートが動作する

## 🛠️ 開発

### ファイル構成

```
ebay-md-exporter/
├── manifest.json          # 拡張機能設定
├── popup.html             # ポップアップUI
├── popup.css              # ポップアップスタイル
├── popup.js               # ポップアップ制御
├── content.js             # ページデータ抽出
├── background.js          # バックグラウンド処理
├── markdown-generator.js  # Markdown生成
├── ai-roles.yaml          # AI役割定義
└── README.md              # このファイル
```

### 開発環境

- **ブラウザ**: Firefox 100+
- **言語**: JavaScript (ES2020)
- **API**: WebExtensions API

### コード構造

- **popup.js**: UI制御・ユーザーインタラクション
- **content.js**: DOM操作・データ抽出
- **background.js**: ダウンロード・メッセージング
- **markdown-generator.js**: Markdown生成・フォーマット

## 🐛 トラブルシューティング

### よくある問題

**Q: アイコンをクリックしても何も起こらない**
A: eBay商品ページ以外では動作しません。URLが `/itm/` を含むことを確認してください。

**Q: データが正しく取得されない**
A: ページが完全に読み込まれてから実行してください。新しいeBayレイアウトでは動作しない場合があります。

**Q: 画像URLが表示されない**
A: 画像の遅延読み込みが原因の可能性があります。ページを少しスクロールしてから実行してください。

**Q: 日本語ファイル名が文字化けする**
A: Firefoxのダウンロード設定で文字エンコードを確認してください。

### デバッグ

1. `about:debugging` → 「このFirefox」で拡張機能のページを開く
2. 「調査」ボタンでデベロッパーツールを開く
3. コンソールでエラーメッセージを確認

## 📜 ライセンス

MIT License

## 🤝 貢献

バグ報告や機能要望は Issue でお知らせください。プルリクエストも歓迎します。

### 開発に参加する

1. フォークしてクローン
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 更新履歴

### v1.0.0 (2025-06-10)
- 初回リリース
- eBay商品ページからのデータ抽出
- Markdown形式でのエクスポート
- Firefox拡張機能として提供

## 🙏 謝辞

このプロジェクトは AI開発フレームワークの一環として開発されました。
