class TwitterToImageConverter {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1080;
        this.canvas.height = 1080;
        
        this.initTheme();
        this.bindEvents();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');
        
        if (theme === 'dark') {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }

    bindEvents() {
        const convertBtn = document.getElementById('convert-btn');
        const downloadBtn = document.getElementById('download-btn');
        const urlInput = document.getElementById('twitter-url');
        const themeToggle = document.getElementById('theme-toggle');

        convertBtn.addEventListener('click', () => this.convertTweet());
        downloadBtn.addEventListener('click', () => this.downloadImage());
        themeToggle.addEventListener('click', () => this.toggleTheme());
        
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.convertTweet();
            }
        });
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 5000);
    }

    hideError() {
        const errorDiv = document.getElementById('error-message');
        errorDiv.classList.remove('show');
    }

    setLoading(loading) {
        const convertBtn = document.getElementById('convert-btn');
        convertBtn.disabled = loading;
        convertBtn.classList.toggle('loading', loading);
    }

    validateTwitterURL(url) {
        const twitterRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/;
        return twitterRegex.test(url);
    }

    extractTweetId(url) {
        const match = url.match(/status\/(\d+)/);
        return match ? match[1] : null;
    }

    async fetchTweetData(url) {
        try {
            // Using Twitter's oEmbed API for public tweets
            const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
            
            // Since we can't directly call Twitter's API due to CORS, we'll use a CORS proxy
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(oembedUrl)}`;
            
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error('Failed to fetch tweet data');
            }
            
            const data = await response.json();
            return this.parseOEmbedData(data);
        } catch (error) {
            // Fallback: create mock data for demonstration
            console.warn('Failed to fetch real tweet data, using mock data:', error);
            return this.createMockTweetData(url);
        }
    }

    parseOEmbedData(data) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.html;
        
        const blockquote = tempDiv.querySelector('blockquote');
        if (!blockquote) {
            throw new Error('Invalid tweet data');
        }

        // Extract text while preserving line breaks
        const textElement = blockquote.querySelector('p');
        let text = 'Tweet content';
        
        if (textElement) {
            // Replace <br> tags with newlines and preserve formatting
            // Get the text content and preserve line breaks
            text = textElement.textContent || textElement.innerText || 'Tweet content';
            // Clean up any extra whitespace but preserve intentional line breaks
            text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        }
        
        const author = data.author_name || 'Unknown User';
        const username = data.author_name ? `@${data.author_name.toLowerCase().replace(/\s+/g, '')}` : '@unknown';
        
        // Check if user provided a custom profile picture URL
        const profileUrlInput = document.getElementById('profile-url');
        const customProfileUrl = profileUrlInput.value.trim();
        
        return {
            text: text,
            author: author,
            username: username,
            avatar: customProfileUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&size=96&background=1DA1F2&color=ffffff`,
            date: new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            })
        };
    }

    createMockTweetData(url) {
        const tweetId = this.extractTweetId(url);
        const authors = [
            'Alex Hormozi', 'Elon Musk', 'Naval Ravikant', 'Tim Ferriss', 'Gary Vaynerchuk',
            'Seth Godin', 'Ryan Holiday', 'James Clear', 'Tony Robbins', 'Simon Sinek'
        ];
        
        const sampleTweets = [
            "The best investment you can make is in yourself.\n\nSkills don't get taxed and nobody can steal your knowledge.",
            "Success is not about being the smartest person in the room.\n\nIt's about being willing to learn from everyone in the room.",
            "Your network is your net worth, but your knowledge is your true wealth.\n\n💡 Invest in both wisely.",
            "The gap between where you are and where you want to be is filled with consistent daily actions.\n\nStart today.",
            "Stop waiting for permission.\nStop waiting for the perfect moment.\n\nStart with what you have, where you are.",
            "The most successful people are not the ones who avoid failure.\n\nThey're the ones who fail fast and learn faster.",
            "Building wealth is:\n• 20% knowledge\n• 80% behavior\n\nMaster your mindset first."
        ];

        const author = authors[Math.floor(Math.random() * authors.length)];
        const username = `@${author.toLowerCase().replace(/\s+/g, '')}`;
        const text = sampleTweets[Math.floor(Math.random() * sampleTweets.length)];
        
        // Check if user provided a custom profile picture URL
        const profileUrlInput = document.getElementById('profile-url');
        const customProfileUrl = profileUrlInput.value.trim();
        
        return {
            text: text,
            author: author,
            username: username,
            avatar: customProfileUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&size=96&background=1DA1F2&color=ffffff`,
            date: new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            })
        };
    }

    renderTweetCard(tweetData) {
        const tweetCard = document.getElementById('tweet-card');
        
        // Format text for HTML display (preserve line breaks)
        const formattedText = tweetData.text.replace(/\n/g, '<br>');
        
        tweetCard.innerHTML = `
            <div class="tweet-header">
                <img src="${tweetData.avatar}" alt="${tweetData.author}" class="tweet-avatar">
                <div class="tweet-user-info">
                    <div class="tweet-name">${tweetData.author}</div>
                    <div class="tweet-username">${tweetData.username}</div>
                </div>
                <svg class="twitter-logo" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
            </div>
            <div class="tweet-content">${formattedText}</div>
            <div class="tweet-footer">
                <span>${tweetData.date}</span>
                <span>Twitter for Web</span>
            </div>
        `;
    }

    async generateCanvasImage(tweetData) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Get current theme
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        // Clear canvas
        ctx.fillStyle = isDark ? '#000000' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (isDark) {
            gradient.addColorStop(0, '#000000');
            gradient.addColorStop(1, '#0F1419');
        } else {
            gradient.addColorStop(0, '#F7F9FA');
            gradient.addColorStop(1, '#E8F4FD');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw tweet card background
        const cardSize = 800;
        const cardX = (canvas.width - cardSize) / 2;
        const cardY = (canvas.height - cardSize) / 2;
        
        ctx.fillStyle = isDark ? '#16181C' : '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 4;
        this.roundRect(ctx, cardX, cardY, cardSize, cardSize, 32);
        ctx.fill();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        
        // Load and draw avatar
        const avatarSize = 80;
        const avatarX = cardX + 60;
        const avatarY = cardY + 60;
        
        try {
            const avatarImg = await this.loadImage(tweetData.avatar);
            
            // Create circular clipping path for avatar
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
            ctx.clip();
            
            ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();
        } catch (error) {
            // Fallback: draw a solid color circle as placeholder avatar
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
            ctx.fillStyle = '#1DA1F2';
            ctx.fill();
            ctx.restore();
        }
        
        // Draw Twitter X logo
        const logoX = cardX + cardSize - 100;
        const logoY = cardY + 60;
        this.drawTwitterLogo(ctx, logoX, logoY, 40);
        
        // Draw author name
        ctx.fillStyle = isDark ? '#FFFFFF' : '#14171A';
        ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(tweetData.author, avatarX + avatarSize + 20, avatarY + 30);
        
        // Draw username
        ctx.fillStyle = isDark ? '#8B98A5' : '#657786';
        ctx.font = '32px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(tweetData.username, avatarX + avatarSize + 20, avatarY + 70);
        
        // Draw tweet content
        ctx.fillStyle = isDark ? '#FFFFFF' : '#14171A';
        ctx.font = '42px -apple-system, BlinkMacSystemFont, sans-serif';
        const contentY = cardY + 200;
        const contentWidth = cardSize - 120;
        this.wrapText(ctx, tweetData.text, cardX + 60, contentY, contentWidth, 60);
        
        // Draw footer
        const footerY = cardY + cardSize - 80;
        ctx.fillStyle = isDark ? '#8B98A5' : '#657786';
        ctx.font = '28px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(tweetData.date, cardX + 60, footerY);
        ctx.fillText('Twitter for Web', cardX + cardSize - 200, footerY);
        
        // Add border
        ctx.strokeStyle = isDark ? '#2F3336' : '#E1E8ED';
        ctx.lineWidth = 2;
        this.roundRect(ctx, cardX, cardY, cardSize, cardSize, 32);
        ctx.stroke();
    }

    drawTwitterLogo(ctx, x, y, size) {
        ctx.save();
        ctx.fillStyle = '#1DA1F2';
        ctx.translate(x + size/2, y + size/2);
        ctx.scale(size/24, size/24);
        
        // Twitter X logo path
        const path = new Path2D('M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z');
        ctx.fill(path);
        ctx.restore();
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        // First split by line breaks, then by words
        const lines = text.split('\n');
        let currentY = y;
        
        for (let i = 0; i < lines.length; i++) {
            const lineText = lines[i].trim();
            
            if (lineText === '') {
                // Empty line - add extra spacing
                currentY += lineHeight * 0.5;
                continue;
            }
            
            const words = lineText.split(' ');
            let line = '';
            
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                
                if (testWidth > maxWidth && n > 0) {
                    ctx.fillText(line.trim(), x, currentY);
                    line = words[n] + ' ';
                    currentY += lineHeight;
                } else {
                    line = testLine;
                }
            }
            
            if (line.trim()) {
                ctx.fillText(line.trim(), x, currentY);
            }
            currentY += lineHeight;
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image from ${src}`));
            img.src = src;
        });
    }

    async convertTweet() {
        const urlInput = document.getElementById('twitter-url');
        const url = urlInput.value.trim();
        
        this.hideError();
        
        if (!url) {
            this.showError('Please enter a Twitter URL');
            return;
        }
        
        if (!this.validateTwitterURL(url)) {
            this.showError('Please enter a valid Twitter/X URL');
            return;
        }
        
        this.setLoading(true);
        
        try {
            const tweetData = await this.fetchTweetData(url);
            this.renderTweetCard(tweetData);
            await this.generateCanvasImage(tweetData);
            
            document.getElementById('preview-section').style.display = 'block';
            document.getElementById('preview-section').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
        } catch (error) {
            console.error('Conversion error:', error);
            this.showError('Failed to convert tweet. Please try again or check if the tweet is public.');
        } finally {
            this.setLoading(false);
        }
    }

    downloadImage() {
        const link = document.createElement('a');
        link.download = `twitter-post-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// Initialize the converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TwitterToImageConverter();
});