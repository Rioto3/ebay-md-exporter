// content.js - eBayページからデータを抽出するコンテンツスクリプト

class EbayDataExtractor {
    constructor() {
        this.data = {
            title: '',
            itemId: '',
            price: '',
            approximatePrice: '',
            condition: '',
            description: '',
            seller: '',
            sellerFeedback: '',
            location: '',
            shipping: '',
            delivery: '',
            returns: '',
            payments: '',
            images: [],
            bids: '',
            timeLeft: '',
            url: window.location.href,
            extractedAt: new Date().toISOString()
        };
    }

    extract() {
        try {
            this.extractBasicInfo();
            this.extractPriceInfo();
            this.extractSellerInfo();
            this.extractShippingInfo();
            this.extractImages();
            this.extractBidInfo();
            this.extractPaymentInfo();
            
            console.log('Extracted eBay data:', this.data);
            return this.data;
        } catch (error) {
            console.error('Error extracting eBay data:', error);
            return null;
        }
    }

    extractBasicInfo() {
        // タイトル
        const titleSelectors = [
            'h1.x-item-title__mainTitle .ux-textspans',
            'h1 .it-ttl',
            'h1.x-item-title-label'
        ];
        this.data.title = this.getTextFromSelectors(titleSelectors);

        // 商品ID（URLから）
        const itemIdMatch = window.location.href.match(/\/itm\/(\d+)/);
        if (itemIdMatch) {
            this.data.itemId = itemIdMatch[1];
        }

        // 商品状態
        const conditionSelectors = [
            '.x-item-condition-text .ux-textspans',
            '.u-flL.condText',
            '.ux-icon-text__text .ux-textspans'
        ];
        this.data.condition = this.getTextFromSelectors(conditionSelectors);

        // 商品説明
        this.extractDescription();
    }

    extractDescription() {
        const descSelectors = [
            '.x-item-condition-desc',
            '.descriptions .content',
            '#desc_div',
            '.item-description'
        ];
        
        let description = this.getTextFromSelectors(descSelectors);
        
        // 長すぎる場合は短縮
        if (description && description.length > 300) {
            description = description.substring(0, 300) + '...';
        }
        
        this.data.description = description;
    }

    extractPriceInfo() {
        // 価格
        const priceSelectors = [
            '.x-price-primary .ux-textspans',
            '.x-bid-price .ux-textspans',
            '.notranslate',
            '.u-flL.price'
        ];
        this.data.price = this.getTextFromSelectors(priceSelectors);

        // 近似価格（JPY等）
        const approxSelectors = [
            '.x-price-approx__price .ux-textspans',
            '.convert-price .notranslate'
        ];
        this.data.approximatePrice = this.getTextFromSelectors(approxSelectors);
    }

    extractSellerInfo() {
        // 出品者名
        const sellerSelectors = [
            '.x-sellercard-atf__info__about-seller .ux-textspans',
            '.mbg .info a',
            '.seller-persona .info a'
        ];
        this.data.seller = this.getTextFromSelectors(sellerSelectors);

        // 出品者評価
        const feedbackSelectors = [
            '.x-sellercard-atf__data-item .ux-textspans',
            '.mbg .info .score',
            '.seller-persona .reviews'
        ];
        this.data.sellerFeedback = this.getTextFromSelectors(feedbackSelectors);

        // 所在地
        const locationSelectors = [
            '.ux-labels-values--deliverto .ux-textspans:last-child',
            '.location .text',
            '.seller-info .location'
        ];
        
        // "Located in:" などのテキストを除去
        let location = this.getTextFromSelectors(locationSelectors);
        if (location) {
            location = location.replace(/^Located in:\s*/i, '').trim();
        }
        this.data.location = location;
    }

    extractShippingInfo() {
        // 配送料
        const shippingSelectors = [
            '.ux-labels-values--shipping .ux-textspans',
            '.vi-price .notranslate',
            '.shipping-cost'
        ];
        this.data.shipping = this.getTextFromSelectors(shippingSelectors);

        // 配送予定
        const deliverySelectors = [
            '.ux-labels-values--deliverto .ux-textspans',
            '.delivery-time',
            '.estimated-delivery'
        ];
        this.data.delivery = this.getTextFromSelectors(deliverySelectors);

        // 返品ポリシー
        const returnsSelectors = [
            '.ux-labels-values--returns .ux-textspans',
            '.returns-policy',
            '.return-policy'
        ];
        this.data.returns = this.getTextFromSelectors(returnsSelectors);
    }

    extractBidInfo() {
        // 入札数
        const bidSelectors = [
            '.x-bid-count .ux-textspans',
            '.bid-note',
            '.auction-info .bids'
        ];
        this.data.bids = this.getTextFromSelectors(bidSelectors);

        // 残り時間
        const timeSelectors = [
            '.x-end-time .ux-timer__text',
            '.ux-timer__time-left',
            '.time-left'
        ];
        this.data.timeLeft = this.getTextFromSelectors(timeSelectors);
    }

    extractPaymentInfo() {
        // 支払い方法（アイコンのaria-labelから）
        const paymentElements = document.querySelectorAll(
            '.ux-labels-values--payments [role="img"], .ux-payment-icon, .payment-methods img'
        );
        
        const payments = [];
        paymentElements.forEach(el => {
            const label = el.getAttribute('aria-label') || 
                         el.getAttribute('title') || 
                         el.getAttribute('alt');
            if (label && !payments.includes(label)) {
                payments.push(label);
            }
        });
        
        this.data.payments = payments.join(', ');
    }

    extractImages() {
        const imageSelectors = [
            'img[data-zoom-src]',
            'img[src*="ebayimg.com"]',
            '.ux-image-carousel img',
            '.gallery img'
        ];
        
        const images = new Set();
        
        imageSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(img => {
                let url = img.getAttribute('data-zoom-src') || 
                         img.getAttribute('data-src') || 
                         img.src;
                
                if (url && url.includes('ebayimg.com')) {
                    // 高解像度版のURLを生成
                    url = this.getHighResolutionImageUrl(url);
                    
                    // サムネイルやアイコンを除外
                    if (!this.isThumbailOrIcon(url)) {
                        images.add(url);
                    }
                }
            });
        });
        
        this.data.images = Array.from(images).slice(0, 20); // 最大20枚
    }

    getHighResolutionImageUrl(url) {
        // s-l64, s-l140, s-l300 などを s-l1600 に変更
        return url.replace(/s-l\d+/, 's-l1600');
    }

    isThumbailOrIcon(url) {
        // サムネイルやアイコンのURLパターンを除外
        const excludePatterns = [
            /s-l64/,
            /s-l96/,
            /s-l32/,
            /s-l48/,
            /icon/i,
            /thumb/i,
            /avatar/i
        ];
        
        return excludePatterns.some(pattern => pattern.test(url));
    }

    getTextFromSelectors(selectors) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        return '';
    }

    // より詳細な画像URLパターンを処理
    processImageUrl(url) {
        if (!url || !url.includes('ebayimg.com')) return null;
        
        // 高解像度に変換
        let processed = url.replace(/s-l\d+/, 's-l1600');
        
        // HTTPSに変換
        if (processed.startsWith('http://')) {
            processed = processed.replace('http://', 'https://');
        }
        
        return processed;
    }

    // セレクターの優先順位で要素を取得
    getElementByPriority(selectors) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        return null;
    }
}

// メイン処理
(() => {
    const extractor = new EbayDataExtractor();
    return extractor.extract();
})();
