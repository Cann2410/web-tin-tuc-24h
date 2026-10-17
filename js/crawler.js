/**
 * PHẦN 3: CROWLER TIN TỨC DÂN TRÍ
 * Hàm getArticle(url) bóc tách dữ liệu bài viết từ Dantri.com.vn
 */
async function getArticle(url) {
    try {
        // Sử dụng CORS Proxy để đọc HTML từ dantri.com.vn không bị chặn
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
        const idMatch = fileName.match(/(\d+)\.htm/);
        const id = idMatch ? `dtri-${idMatch[1]}` : `dtri-${Date.now()}`;
        const slug = fileName.replace(/\.htm$/, '').replace(/-\d+$/, '');

        // 2. Trích xuất Tiêu đề (title) theo selector Dân trí
        const title = getText('#articleContent [data-slot="title"]') || 
                      getText('h1.title-page') || 
                      getText('h1');

        // 3. Trích xuất Tóm tắt (sapo/excerpt)
        const excerpt = getText('#articleContent [data-slot="sapo"]') || 
                        getText('h2.singular-sapo') || 
                        getText('.sapo');

        // 4. Trích xuất Nội dung chính (content)
        const contentEl = doc.querySelector('#articleContent [data-slot="content"], .singular-content, .article-body');
        if (contentEl) {
            // Xóa quảng cáo, video, bài viết liên quan
            contentEl.querySelectorAll('.relate-container, .video-content-wrapper, iframe, script, style').forEach(el => el.remove());
        }
        const contentText = contentEl ? contentEl.textContent.trim() : "";

        // 5. Trích xuất Tác giả (author) - ưu tiên vị trí index 1 theo mẫu Dân trí
        let author = getText('#articleContent [rel="author"]', 1) || 
                     getText('#articleContent [rel="author"]', 0) || 
                     getText('.author-name') || 
                     'Dân trí';

        // 6. Ánh xạ Chuyên mục (category) từ slug sang Tiếng Việt có dấu
        const categoryMap = {
            'thoi-su': 'Thời sự',
            'the-gioi': 'Thế giới',
            'kinh-doanh': 'Kinh doanh',
            'bat-dong-san': 'Bất động sản',
            'the-thao': 'Thể thao',
            'lao-dong-viec-lam': 'Lao động',
            'suc-khoe': 'Sức khỏe',
            'van-hoa': 'Văn hóa',
            'giai-tri': 'Giải trí',
            'du-lich': 'Du lịch',
            'phap-luat': 'Pháp luật',
            'doi-song': 'Đời sống',
            'cong-nghe': 'Công nghệ'
        };

        let category = doc.querySelector('ul.breadcrumbs li:last-child a, .breadcrumbs a:last-child')?.textContent?.trim() ||
                       categoryMap[rawCategorySlug] || 'Thời sự';

        // 7. Trích xuất Thời gian đăng (publishedAt) tự động, không gán cứng
        let rawTime = getText('time') || getText('.author-time') || getText('.singular-time');
        let publishedAt = rawTime;
        const timeMatch = rawTime.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}:\d{2})/);
        if (timeMatch) {
            const [_, day, month, year, timeStr] = timeMatch;
            publishedAt = `${year}-${month}-${day} ${timeStr}`;
        } else if (!publishedAt) {
            const now = new Date();
            publishedAt = now.toISOString().slice(0, 16).replace('T', ' ');
        }

        // 8. Trích xuất Ảnh đại diện (thumbnail)
        let thumbnail = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                        doc.querySelector('#articleContent img, .singular-content img')?.getAttribute('src') ||
                        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop';

        // TRẢ VỀ OBJECT DỮ LIỆU ĐÚNG 10 TRƯỜNG ĐỀ BÀI
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
