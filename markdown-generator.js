// markdown-generator.js - Markdown生成ユーティリティ

class MarkdownGenerator {
    constructor() {
        this.options = {
            includeImages: true,
            includeDescription: true,
            includeShipping: true,
            includePayments: true,
            maxImages: 15,
            maxDescriptionLength: 500
        };
    }

    setOptions(options) {
        this.options = { ...this.options, ...options };
    }

    generate(data, customOptions = {}) {
        const opts = { ...this.options, ...customOptions };
        
        if (!data || !data.title) {
            throw new Error('Invalid data: title is required');
        }

        let markdown = '';

        // ヘッダー
        markdown += this.generateHeader(data);
        
        // 基本情報
        markdown += this.generateBasicInfo(data);
        
        // 価格情報
        markdown += this.generatePriceInfo(data);
        
        // 商品説明
        if (opts.includeDescription) {
            markdown += this.generateDescription(data, opts.maxDescriptionLength);
        }
        
        // 出品者情報
        markdown += this.generateSellerInfo(data);
        
        // 配送・返品情報
        if (opts.includeShipping) {
            markdown += this.generateShippingInfo(data);
        }
        
        // 支払い方法
        if (opts.includePayments) {
            markdown += this.generatePaymentInfo(data);
        }
        
        // 商品画像
        if (opts.includeImages) {
            markdown += this.generateImages(data, opts.maxImages);
        }
        
        // フッター
        markdown += this.generateFooter(data);

        return markdown;
    }

    generateHeader(data) {
        return `# ${this.escapeMarkdown(data.title)}\n\n`;
    }

    generateBasicInfo(data) {
        let section = `## 基本情報\n`;
        
        if (data.itemId) {
            section += `- **商品ID**: ${data.itemId}\n`;
        }
        
        if (data.condition) {
            section += `- **状態**: ${this.escapeMarkdown(data.condition)}\n`;
        }
        
        if (data.bids) {
            section += `- **入札**: ${this.escapeMarkdown(data.bids)}\n`;
        }
        
        if (data.timeLeft) {
            section += `- **残り時間**: ${this.escapeMarkdown(data.timeLeft)}\n`;
        }
        
        section += `- **URL**: ${data.url}\n`;
        
        if (data.extractedAt) {
            const date = new Date(data.extractedAt);
            section += `- **データ取得日時**: ${date.toLocaleString('ja-JP')}\n`;
        }
        
        return section + '\n';
    }

    generatePriceInfo(data) {
        if (!data.price && !data.approximatePrice) return '';
        
        let section = `## 価格情報\n`;
        
        if (data.price) {
            section += `- **価格**: ${this.escapeMarkdown(data.price)}\n`;
        }
        
        if (data.approximatePrice) {
            section += `- **参考価格**: ${this.escapeMarkdown(data.approximatePrice)}\n`;
        }
        
        return section + '\n';
    }

    generateDescription(data, maxLength) {
        if (!data.description) return '';
        
        let description = data.description.trim();
        
        // 長すぎる場合は短縮
        if (maxLength && description.length > maxLength) {
            description = description.substring(0, maxLength) + '...';
        }
        
        return `## 商品説明\n${this.escapeMarkdown(description)}\n\n`;
    }

    generateSellerInfo(data) {
        if (!data.seller) return '';
        
        let section = `## 出品者情報\n`;
        section += `- **出品者**: ${this.escapeMarkdown(data.seller)}\n`;
        
        if (data.sellerFeedback) {
            section += `- **評価**: ${this.escapeMarkdown(data.sellerFeedback)}\n`;
        }
        
        if (data.location) {
            section += `- **所在地**: ${this.escapeMarkdown(data.location)}\n`;
        }
        
        return section + '\n';
    }

    generateShippingInfo(data) {
        if (!data.shipping && !data.delivery && !data.returns) return '';
        
        let section = `## 配送・返品\n`;
        
        if (data.shipping) {
            section += `- **配送料**: ${this.escapeMarkdown(data.shipping)}\n`;
        }
        
        if (data.delivery) {
            section += `- **配送予定**: ${this.escapeMarkdown(data.delivery)}\n`;
        }
        
        if (data.returns) {
            section += `- **返品**: ${this.escapeMarkdown(data.returns)}\n`;
        }
        
        return section + '\n';
    }

    generatePaymentInfo(data) {
        if (!data.payments) return '';
        
        return `## 支払い方法\n${this.escapeMarkdown(data.payments)}\n\n`;
    }

    generateImages(data, maxImages) {
        if (!data.images || data.images.length === 0) return '';
        
        let section = `## 商品画像\n`;
        
        const imagesToInclude = data.images.slice(0, maxImages);
        
        imagesToInclude.forEach((url, index) => {
            const alt = `商品画像 ${index + 1}`;
            section += `![${alt}](${url})\n`;
        });
        
        if (data.images.length > maxImages) {
            section += `\n*他 ${data.images.length - maxImages} 枚の画像があります*\n`;
        }
        
        return section + '\n';
    }

    generateFooter(data) {
        const now = new Date();
        let footer = `---\n`;
        footer += `*Exported by eBay MD Exporter*\n`;
        footer += `*Generated: ${now.toLocaleString('ja-JP')}*\n`;
        
        if (data.extractedAt) {
            const extractTime = new Date(data.extractedAt);
            footer += `*Data from: ${extractTime.toLocaleString('ja-JP')}*\n`;
        }
        
        return footer;
    }

    // Markdownの特殊文字をエスケープ
    escapeMarkdown(text) {
        if (typeof text !== 'string') return text;
        
        return text
            .replace(/\\/g, '\\\\')
            .replace(/\*/g, '\\*')
            .replace(/_/g, '\\_')
            .replace(/`/g, '\\`')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
            .replace(/>/g, '\\>')
            .replace(/#/g, '\\#')
            .replace(/\+/g, '\\+')
            .replace(/-/g, '\\-')
            .replace(/\./g, '\\.')
            .replace(/!/g, '\\!');
    }

    // 軽量版Markdown（基本情報のみ）
    generateLite(data) {
        let md = `# ${this.escapeMarkdown(data.title)}\n\n`;
        
        if (data.price) {
            md += `**価格**: ${this.escapeMarkdown(data.price)}\n`;
        }
        
        if (data.condition) {
            md += `**状態**: ${this.escapeMarkdown(data.condition)}\n`;
        }
        
        if (data.seller) {
            md += `**出品者**: ${this.escapeMarkdown(data.seller)}\n`;
        }
        
        md += `**URL**: ${data.url}\n\n`;
        
        if (data.images && data.images.length > 0) {
            md += `![商品画像](${data.images[0]})\n\n`;
        }
        
        md += `*Generated by eBay MD Exporter*`;
        
        return md;
    }
}

// Firefoxでは window.MarkdownGenerator として公開
if (typeof window !== 'undefined') {
    window.MarkdownGenerator = MarkdownGenerator;
}

// Node.js環境での使用も考慮
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownGenerator;
}
