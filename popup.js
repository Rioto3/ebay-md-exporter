// popup.js - 拡張機能のポップアップ制御

class EbayMdExporter {
    constructor() {
        this.currentData = null;
        this.init();
    }

    async init() {
        await this.checkCurrentPage();
        this.setupEventListeners();
    }

    async checkCurrentPage() {
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];
            
            if (this.isEbayItemPage(tab.url)) {
                this.updateStatus('eBay商品ページを検出', 'success');
                this.updateCurrentPage(`${tab.title}`);
                this.enableExportButton();
                await this.extractItemData(tab);
            } else {
                this.updateStatus('eBayページではありません', 'error');
                this.updateCurrentPage('eBay商品ページを開いてください');
                this.disableExportButton();
            }
        } catch (error) {
            console.error('Error checking current page:', error);
            this.updateStatus('エラーが発生しました', 'error');
        }
    }

    isEbayItemPage(url) {
        return url && (
            url.includes('ebay.com/itm/') || 
            url.includes('ebay.co.jp/itm/')
        );
    }

    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = `status status--${type}`;
    }

    updateCurrentPage(text) {
        document.getElementById('currentPage').textContent = text;
    }

    enableExportButton() {
        const btn = document.getElementById('exportBtn');
        btn.disabled = false;
        btn.textContent = btn.textContent.replace('準備中...', 'MDエクスポート');
    }

    disableExportButton() {
        const btn = document.getElementById('exportBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-icon">📥</span>MDエクスポート';
    }

    setupEventListeners() {
        // エクスポートボタン
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.handleExport();
        });

        // ダウンロードボタン
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.handleDownload();
        });

        // オプションの変更監視
        ['includeImages', 'includeDescription', 'includeShipping'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                if (this.currentData) {
                    this.updatePreview();
                }
            });
        });
    }

    async extractItemData(tab) {
        try {
            // コンテンツスクリプトを注入してデータを取得
            const results = await browser.tabs.executeScript(tab.id, {
                file: 'content.js'
            });

            if (results && results[0]) {
                this.currentData = results[0];
                console.log('Extracted data:', this.currentData);
            }
        } catch (error) {
            console.error('Error extracting data:', error);
        }
    }

    async handleExport() {
        if (!this.currentData) {
            await this.extractCurrentPageData();
        }

        if (this.currentData) {
            this.updatePreview();
            this.showPreviewSection();
        } else {
            this.updateStatus('データの取得に失敗しました', 'error');
        }
    }

    async extractCurrentPageData() {
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];

            this.updateStatus('データを取得中...', 'loading');
            document.getElementById('exportBtn').classList.add('loading');

            const results = await browser.tabs.executeScript(tab.id, {
                code: `(${this.extractDataFromPage.toString()})()`
            });

            if (results && results[0]) {
                this.currentData = results[0];
                this.updateStatus('データ取得完了', 'success');
            } else {
                throw new Error('No data returned');
            }
        } catch (error) {
            console.error('Error extracting data:', error);
            this.updateStatus('データ取得エラー', 'error');
        } finally {
            document.getElementById('exportBtn').classList.remove('loading');
        }
    }

    extractDataFromPage() {
        // この関数はページ内で実行される
        const data = {
            title: '',
            itemId: '',
            price: '',
            condition: '',
            description: '',
            seller: '',
            location: '',
            shipping: '',
            returns: '',
            payments: '',
            images: [],
            url: window.location.href,
            extractedAt: new Date().toISOString()
        };

        try {
            // タイトル
            const titleEl = document.querySelector('h1.x-item-title__mainTitle .ux-textspans, h1 .it-ttl');
            if (titleEl) data.title = titleEl.textContent.trim();

            // 商品ID（URLから）
            const itemIdMatch = window.location.href.match(/\/itm\/(\d+)/);
            if (itemIdMatch) data.itemId = itemIdMatch[1];

            // 価格
            const priceEl = document.querySelector('.x-price-primary .ux-textspans, .notranslate');
            if (priceEl) data.price = priceEl.textContent.trim();

            // 状態
            const conditionEl = document.querySelector('.x-item-condition-text .ux-textspans, .u-flL.condText');
            if (conditionEl) data.condition = conditionEl.textContent.trim();

            // 商品説明（短縮版）
            const descEl = document.querySelector('.x-item-condition-desc, .descriptions .content');
            if (descEl) {
                data.description = descEl.textContent.trim().substring(0, 200) + '...';
            }

            // 出品者
            const sellerEl = document.querySelector('.x-sellercard-atf__info__about-seller .ux-textspans, .mbg .info a');
            if (sellerEl) data.seller = sellerEl.textContent.trim();

            // 所在地
            const locationEl = document.querySelector('[data-testid="ux-labels-values--deliverto"] .ux-textspans:contains("Located"), .location .text');
            if (locationEl) data.location = locationEl.textContent.trim();

            // 配送
            const shippingEl = document.querySelector('[data-testid="ux-labels-values--shipping"] .ux-textspans, .vi-price .notranslate');
            if (shippingEl) data.shipping = shippingEl.textContent.trim();

            // 画像URL収集
            const imageElements = document.querySelectorAll('img[data-zoom-src], img[src*="ebayimg.com"]');
            imageElements.forEach(img => {
                const url = img.getAttribute('data-zoom-src') || img.src;
                if (url && url.includes('ebayimg.com') && !data.images.includes(url)) {
                    // 高解像度版のURLを生成
                    const highResUrl = url.replace(/s-l\d+/, 's-l1600');
                    data.images.push(highResUrl);
                }
            });

            // 重複削除
            data.images = [...new Set(data.images)];

        } catch (error) {
            console.error('Error extracting page data:', error);
        }

        return data;
    }

    updatePreview() {
        const markdown = this.generateMarkdown();
        document.getElementById('preview').value = markdown;
    }

    generateMarkdown() {
        if (!this.currentData) return '';

        const options = {
            includeImages: document.getElementById('includeImages').checked,
            includeDescription: document.getElementById('includeDescription').checked,
            includeShipping: document.getElementById('includeShipping').checked
        };

        let md = `# ${this.currentData.title}\n\n`;

        // 基本情報
        md += `## 基本情報\n`;
        if (this.currentData.itemId) md += `- **商品ID**: ${this.currentData.itemId}\n`;
        if (this.currentData.price) md += `- **価格**: ${this.currentData.price}\n`;
        if (this.currentData.condition) md += `- **状態**: ${this.currentData.condition}\n`;
        md += `- **URL**: ${this.currentData.url}\n\n`;

        // 商品説明
        if (options.includeDescription && this.currentData.description) {
            md += `## 商品説明\n${this.currentData.description}\n\n`;
        }

        // 出品者情報
        if (this.currentData.seller) {
            md += `## 出品者情報\n`;
            md += `- **出品者**: ${this.currentData.seller}\n`;
            if (this.currentData.location) md += `- **所在地**: ${this.currentData.location}\n`;
            md += `\n`;
        }

        // 配送・返品
        if (options.includeShipping) {
            md += `## 配送・返品\n`;
            if (this.currentData.shipping) md += `- **配送**: ${this.currentData.shipping}\n`;
            if (this.currentData.returns) md += `- **返品**: ${this.currentData.returns}\n`;
            md += `\n`;
        }

        // 画像
        if (options.includeImages && this.currentData.images.length > 0) {
            md += `## 商品画像\n`;
            this.currentData.images.slice(0, 12).forEach((url, index) => {
                md += `![Image ${index + 1}](${url})\n`;
            });
            md += `\n`;
        }

        // フッター
        md += `---\n*Exported by eBay MD Exporter on ${new Date().toLocaleString('ja-JP')}*`;

        return md;
    }

    showPreviewSection() {
        const section = document.getElementById('previewSection');
        section.style.display = 'block';
    }

    handleDownload() {
        const markdown = this.generateMarkdown();
        const filename = this.generateFilename();

        // ダウンロード実行
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        browser.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        }).then(() => {
            this.updateStatus('ダウンロード完了', 'success');
            URL.revokeObjectURL(url);
        }).catch(error => {
            console.error('Download error:', error);
            this.updateStatus('ダウンロードエラー', 'error');
        });
    }

    generateFilename() {
        const title = this.currentData.title || 'ebay-item';
        const sanitized = title
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
        
        const timestamp = new Date().toISOString().split('T')[0];
        return `${sanitized}-${timestamp}.md`;
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    new EbayMdExporter();
});
