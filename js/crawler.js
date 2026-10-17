/**
 * Hàm JavaScript getArticle(url) nhận URL và trả về Object JSON chuẩn hóa
 */
async function getArticle(url) {
    try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const htmlText = await response.text();
        const doc = new DOMParser().parseFromString(htmlText, 'text/html');

        const getText = (selector, index = 0) => {
            const elements = doc.querySelectorAll(selector);
            return elements[index]?.textContent?.trim() || '';
        };

        const parsedUrl = new URL(url);
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
        const rawCategorySlug = pathSegments[0] || 'thoi-su';
        const fileName = pathSegments[pathSegments.length - 1] || '';

        const idMatch = fileName.match(/(\d+)\.htm/);
        const id = idMatch ? `dtri-${idMatch[1]}` : `dtri-${Date.now()}`;
        const slug = fileName.replace(/\.htm$/, '').replace(/-\d+$/, '');

        let thumbnail = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                        doc.querySelector('#articleContent img, .singular-content img')?.getAttribute('src') ||
                        'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=800&auto=format&fit=crop';

        const title = getText('#articleContent [data-slot="title"]') || getText('h1');
        const excerpt = getText('#articleContent [data-slot="sapo"]') || getText('h2.singular-sapo');

        const contentEl = doc.querySelector('#articleContent [data-slot="content"], .singular-content, .article-body');
        if (contentEl) {
            contentEl.querySelectorAll('.relate-container, .video-content-wrapper, iframe, script, style').forEach(el => el.remove());
        }
        const contentText = contentEl ? contentEl.textContent.trim() : "";

        let author = getText('#articleContent [rel="author"]', 1) || 
                     getText('#articleContent [rel="author"]', 0) || 
                     'Dân trí';

        let category = doc.querySelector('ul.breadcrumbs li:last-child a, .breadcrumbs a:last-child')?.textContent?.trim();
        if (!category) {
            const categories = typeof getCategories === 'function' ? getCategories() : [];
            const matchedCat = categories.find(c => c.id === rawCategorySlug);
            category = matchedCat ? matchedCat.title : 'Thời sự';
        }

        let rawTime = getText('time') || getText('.author-time') || getText('.singular-time');
        let publishedAt = rawTime;
        const timeMatch = rawTime.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}:\d{2})/);
        if (timeMatch) {
            const [_, day, month, year, timeStr] = timeMatch;
            publishedAt = `${year}-${month}-${day} ${timeStr}`;
        }

        return {
            "id": id,
            "title": title,
            "slug": slug,
            "excerpt": excerpt,
            "content": contentText,
            "thumbnail": thumbnail,
            "author": author,
            "category": category,
            "publishedAt": publishedAt,
            "source": "dantri.com.vn",
            "url": url
        };

    } catch (error) {
        console.error("Lỗi cào dữ liệu bài viết:", error);
        return null;
    }
}
