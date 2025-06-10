// background.js - バックグラウンドスクリプト

class EbayMdExporterBackground {
    constructor() {
        this.init();
    }

    init() {
        this.setupMessageListener();
        this.setupContextMenu();
        this.setupDownloadListener();
    }

    setupMessageListener() {
        // ポップアップやコンテンツスクリプトからのメッセージを処理
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'exportMarkdown':
                    this.handleExportMarkdown(message.data, sendResponse);
                    return true; // 非同期レスポンス
                
                case 'downloadFile':
                    this.handleDownload(message.filename, message.content, sendResponse);
                    return true;
                
                case 'checkEbayPage':
                    this.handleCheckEbayPage(sender.tab, sendResponse);
                    return true;
                
                default:
                    console.log('Unknown message action:', message.action);
            }
        });
    }

    setupContextMenu() {
        // 右クリックメニューにエクスポート機能を追加
        browser.contextMenus.create({
            id: 'ebay-md-export',
            title: 'eBay商品をMarkdownでエクスポート',
            contexts: ['page'],
            documentUrlPatterns: [
                '*://*.ebay.com/itm/*',
                '*://*.ebay.co.jp/itm/*'
            ]
        });

        browser.contextMenus.onClicked.addListener((info, tab) => {
            if (info.menuItemId === 'ebay-md-export') {
                this.handleContextMenuExport(tab);
            }
        });
    }

    setupDownloadListener() {
        // ダウンロード完了の監視
        browser.downloads.onChanged.addListener((downloadDelta) => {
            if (downloadDelta.state && downloadDelta.state.current === 'complete') {
                console.log('Download completed:', downloadDelta);
            }
        });
    }

    async handleExportMarkdown(data, sendResponse) {
        try {
            const markdown = this.generateMarkdown(data);
            const filename = this.generateFilename(data);
            
            const downloadId = await this.downloadMarkdown(filename, markdown);
            
            sendResponse({
                success: true,
                downloadId: downloadId,
                filename: filename
            });
        } catch (error) {
            console.error('Export error:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    async handleDownload(filename, content, sendResponse) {
        try {
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const downloadId = await browser.downloads.download({
                url: url,
                filename: filename,
                saveAs: false
            });
            
            // メモリリークを防ぐためにURLを解放
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
            
            sendResponse({
                success: true,
                downloadId: downloadId
            });
        } catch (error) {
            console.error('Download error:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    async handleCheckEbayPage(tab, sendResponse) {
        const isEbayPage = this.isEbayItemPage(tab.url);
        sendResponse({
            isEbayPage: isEbayPage,
            url: tab.url,
            title: tab.title
        });
    }

    async handleContextMenuExport(tab) {
        try {
            // コンテンツスクリプトを注入してデータを抽出
            const results = await browser.tabs.executeScript(tab.id, {
                file: 'content.js'
            });

            if (results && results[0]) {
                const data = results[0];
                const markdown = this.generateMarkdown(data);
                const filename = this.generateFilename(data);
                
                await this.downloadMarkdown(filename, markdown);
                
                // 成功通知
                browser.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon-48.png',
                    title: 'eBay MD Exporter',
                    message: `${filename} のエクスポートが完了しました`
                });
            }
        } catch (error) {
            console.error('Context menu export error:', error);
            browser.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon-48.png',
                title: 'eBay MD Exporter',
                message: 'エクスポートに失敗しました: ' + error.message
            });
        }
    }

    generateMarkdown(data) {
        if (!data) return '';

        let md = `# ${data.title || 'eBay商品'}\n\n`;

        // 基本情報
        md += `## 基本情報\n`;
        if (data.itemId) md += `- **商品ID**: ${data.itemId}\n`;
        if (data.price) md += `- **価格**: ${data.price}\n`;
        if (data.approximatePrice) md += `- **参考価格**: ${data.approximatePrice}\n`;
        if (data.condition) md += `- **状態**: ${data.condition}\n`;
        if (data.bids) md += `- **入札**: ${data.bids}\n`;
        if (data.timeLeft) md += `- **残り時間**: ${data.timeLeft}\n`;
        md += `- **URL**: ${data.url}\n\n`;

        // 商品説明
        if (data.description) {
            md += `## 商品説明\n${data.description}\n\n`;
        }

        // 出品者情報
        if (data.seller) {
            md += `## 出品者情報\n`;
            md += `- **出品者**: ${data.seller}\n`;
            if (data.sellerFeedback) md += `- **評価**: ${data.sellerFeedback}\n`;
            if (data.location) md += `- **所在地**: ${data.location}\n`;
            md += `\n`;
        }

        // 配送・返品
        md += `## 配送・返品\n`;
        if (data.shipping) md += `- **配送料**: ${data.shipping}\n`;
        if (data.delivery) md += `- **配送予定**: ${data.delivery}\n`;
        if (data.returns) md += `- **返品**: ${data.returns}\n`;
        md += `\n`;

        // 支払い方法
        if (data.payments) {
            md += `## 支払い方法\n${data.payments}\n\n`;
        }

        // 商品画像
        if (data.images && data.images.length > 0) {
            md += `## 商品画像\n`;
            data.images.forEach((url, index) => {
                md += `![Image ${index + 1}](${url})\n`;
            });
            md += `\n`;
        }

        // メタ情報
        md += `---\n`;
        md += `*Exported by eBay MD Exporter*\n`;
        md += `*Generated on: ${new Date().toLocaleString('ja-JP')}*\n`;
        if (data.extractedAt) {
            md += `*Data extracted at: ${new Date(data.extractedAt).toLocaleString('ja-JP')}*`;
        }

        return md;
    }

    generateFilename(data) {
        let filename = 'ebay-item';
        
        if (data.title) {
            // タイトルをファイル名に適した形に変換
            filename = data.title
                .replace(/[<>:"/\\|?*]/g, '') // 無効な文字を削除
                .replace(/\s+/g, '-') // スペースをハイフンに
                .substring(0, 50); // 長さ制限
        }
        
        // 商品IDがあれば追加
        if (data.itemId) {
            filename += `-${data.itemId}`;
        }
        
        // 日付を追加
        const timestamp = new Date().toISOString().split('T')[0];
        filename += `-${timestamp}`;
        
        return `${filename}.md`;
    }

    async downloadMarkdown(filename, content) {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        try {
            const downloadId = await browser.downloads.download({
                url: url,
                filename: filename,
                saveAs: false
            });
            
            return downloadId;
        } finally {
            // クリーンアップ
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
        }
    }

    isEbayItemPage(url) {
        return url && (
            url.includes('ebay.com/itm/') || 
            url.includes('ebay.co.jp/itm/')
        );
    }

    // ブラウザアクションのバッジを更新
    updateBadge(tabId, isEbayPage) {
        if (isEbayPage) {
            browser.browserAction.setBadgeText({
                text: '✓',
                tabId: tabId
            });
            browser.browserAction.setBadgeBackgroundColor({
                color: '#28a745',
                tabId: tabId
            });
        } else {
            browser.browserAction.setBadgeText({
                text: '',
                tabId: tabId
            });
        }
    }

    // タブ更新時の処理
    handleTabUpdate(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.url) {
            const isEbayPage = this.isEbayItemPage(tab.url);
            this.updateBadge(tabId, isEbayPage);
        }
    }
}

// バックグラウンドスクリプト初期化
const backgroundService = new EbayMdExporterBackground();

// タブ更新の監視
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    backgroundService.handleTabUpdate(tabId, changeInfo, tab);
});

// アクティブタブ変更の監視
browser.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await browser.tabs.get(activeInfo.tabId);
        const isEbayPage = backgroundService.isEbayItemPage(tab.url);
        backgroundService.updateBadge(activeInfo.tabId, isEbayPage);
    } catch (error) {
        console.error('Error handling tab activation:', error);
    }
});

console.log('eBay MD Exporter background script loaded');
