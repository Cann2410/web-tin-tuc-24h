/**
 * PHẦN 3: CROWLER TIN TỨC DÂN TRÍ (TỐI ƯU CƠ CHẾ ĐA PROXY DỰ PHÒNG)
 */

// Hàm hỗ trợ Fetch HTML qua nhiều Proxy trung gian để chống lỗi nghẽn mạng
async function fetchHtmlWithFallback(url) {
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    for (const proxyUrl of proxies) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000); // Timeout 6s mỗi proxy

            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const htmlText = await response.text();
                if (htmlText && htmlText.length > 500) {
                    return htmlText; // Trả về ngay khi lấy được HTML hợp lệ
                }
            }
        } catch (e) {
            console.warn(`Proxy ${proxyUrl} gặp sự cố, đang chuyển sang proxy dự phòng...`);
        }
    }
    return null;
}

async function getArticle(url) {
    try {
        const htmlText = await fetchHtmlWithFallback(url);
        if (!htmlText) {
            throw new Error("Tất cả các CORS Proxy đều không phản hồi.");
        }

        const doc = new DOMParser().parseFromString(htmlText, 'text/html');

        const getText = (selector, index = 0) => {
            const elements = doc.querySelectorAll(selector);
            return elements[index]?.textContent?.trim() || '';
        };

        const parsedUrl = new URL(url);
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
        const rawCategorySlug = pathSegments[0] || 'thoi-su';
        const fileName = pathSegments[pathSegments.length - 1] || '';

        // 1. Trích xuất ID & Slug
        const idMatch = fileName.match(/(\d+)\.htm/);
        const id = idMatch ? `dtri-${idMatch[1]}` : `dtri-${Date.now()}`;
        const slug = fileName.replace(/\.htm$/, '').replace(/-\d+$/, '');

        // 2. Trích xuất Tiêu đề (Bổ sung linh hoạt nhiều selector)
        const title = getText('#articleContent [data-slot="title"]') || 
                      getText('h1.title-page') || 
                      getText('h1') || 
                      doc.querySelector('title')?.textContent?.replace('- Báo Dân trí', '')?.trim() || 
                      'Chưa có tiêu đề';

        // 3. Trích xuất Tóm tắt (Sapo)
        const excerpt = getText('#articleContent [data-slot="sapo"]') || 
                        getText('h2.singular-sapo') || 
                        getText('.sapo') || 
                        '';

        // 4. Trích xuất Nội dung
        let contentEl = doc.querySelector('#articleContent [data-slot="content"]') || 
                        doc.querySelector('.singular-content') || 
                        doc.querySelector('.article-body') || 
                        doc.querySelector('#articleContent');

        if (contentEl) {
            contentEl = contentEl.cloneNode(true);
            contentEl.querySelectorAll('.relate-container, .video-content-wrapper, iframe, script, style, .author-time').forEach(el => el.remove());
        }
        const contentText = contentEl ? contentEl.textContent.trim() : title;

        // 5. Trích xuất Tác giả
        let author = getText('#articleContent [rel="author"]', 1) || 
                     getText('#articleContent [rel="author"]', 0) || 
                     getText('.author-name') || 
                     'Dân trí';

        // 6. Trích xuất Chuyên mục
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
                       categoryMap[rawCategorySlug] || 'Tin tức';

        // 7. Trích xuất Thời gian đăng
        let rawTime = getText('time') || getText('.author-time') || getText('.singular-time');
        let publishedAt = '';
        const timeMatch = rawTime.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}:\d{2})/);
        if (timeMatch) {
            const [_, day, month, year, timeStr] = timeMatch;
            publishedAt = `${year}-${month}-${day} ${timeStr}`;
        } else {
            const now = new Date();
            publishedAt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        }

        // 8. Trích xuất Ảnh đại diện
        let thumbnail = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                        doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                        doc.querySelector('#articleContent img, .singular-content img')?.getAttribute('src') ||
                        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop';

        // Trả về Object JSON 10 trường đúng chuẩn
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
