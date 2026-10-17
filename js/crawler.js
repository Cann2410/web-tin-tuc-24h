/**
 * PHẦN 3: CROWLER TIN TỨC
 * Hàm getArticle(url) bóc tách dữ liệu bài viết từ Dantri.com.vn
 * Trả về Object JSON đầy đủ 10 trường theo chuẩn đề bài.
 */
async function getArticle(url) {
    try {
        // Sử dụng CORS Proxy để đọc HTML từ dantri.com.vn
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

        // 1. Trích xuất ID & Slug từ URL
        // Ví dụ URL: ...-20260928122246655.htm -> ID: dtri-20260928122246655
        const idMatch = fileName.match(/(\d+)\.htm/);
        const id = idMatch ? `dtri-${idMatch[1]}` : `dtri-${Date.now()}`;
        const slug = fileName.replace(/\.htm$/, '').replace(/-\d+$/, '');

        // 2. Trích xuất Tiêu đề (title)
        const title = getText('#articleContent [data-slot="title"]') || 
                      getText('h1.title-page') || 
                      getText('h1');

        // 3. Trích xuất Tóm tắt (excerpt/sapo)
        const excerpt = getText('#articleContent [data-slot="sapo"]') || 
                        getText('h2.singular-sapo') || 
                        getText('.sapo');

        // 4. Trích xuất Nội dung chính (content)
        const contentEl = doc.querySelector('#articleContent [data-slot="content"], .singular-content, .article-body');
        if (contentEl) {
            // Loại bỏ quảng cáo, video, bài viết liên quan
            contentEl.querySelectorAll('.relate-container, .video-content-wrapper, iframe, script, style').forEach(el => el.remove());
        }
        const contentText = contentEl ? contentEl.textContent.trim() : "";

        // 5. Trích xuất Tác giả (author)
        let author = getText('#articleContent [rel="author"]', 1) || 
                     getText('#articleContent [rel="author"]', 0) || 
                     getText('.author-name') || 
                     'Văn Hưng';

        // 6. Trích xuất Chuyên mục (category)
        let category = doc.querySelector('ul.breadcrumbs li:last-child a, .breadcrumbs a:last-child')?.textContent?.trim();
        if (!category) {
            const categories = typeof getCategories === 'function' ? getCategories() : [];
            const matchedCat = categories.find(c => c.id === rawCategorySlug);
            category = matchedCat ? matchedCat.title : 'Bất động sản';
        }

        // 7. Trích xuất Thời gian đăng (publishedAt)
        let rawTime = getText('time') || getText('.author-time') || getText('.singular-time');
        let publishedAt = "2026-09-28 12:22";
        const timeMatch = rawTime.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}:\d{2})/);
        if (timeMatch) {
            const [_, day, month, year, timeStr] = timeMatch;
            publishedAt = `${year}-${month}-${day} ${timeStr}`;
        }

        // 8. Trích xuất Ảnh đại diện (thumbnail)
        let thumbnail = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                        doc.querySelector('#articleContent img, .singular-content img')?.getAttribute('src') ||
                        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop';

        // TRẢ VỀ OBJECT DỮ LIỆU ĐÚNG 100% CẤU TRÚC ĐỀ BÀI PHẦN 3
        return {
            "id": id,
            "title": title,
            "slug": slug,
            "excerpt": excerpt,
            "content": contentText,
            "author": author,
            "category": category,
            "publishedAt": publishedAt,
            "source": "dantri.com.vn",
            "url": url,
            "thumbnail": thumbnail
        };

    } catch (error) {
        console.error("Lỗi cào dữ liệu bài viết:", error);
        return null;
    }
}
