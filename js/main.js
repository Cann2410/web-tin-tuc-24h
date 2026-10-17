// === HIỂN THỊ LAYOUT ĐÚNG YÊU CẦU: 1 BÀI LỚN BÊN TRÁI + 2 BÀI NHỎ BÊN PHẢI ===
function renderCategory(catId = 'home') {
    const app = document.getElementById('appView');
    const posts = getPosts();
    const categories = getCategories();

    document.querySelectorAll('.nav-menu a').forEach(el => el.classList.remove('active'));
    const activeNav = document.getElementById(`nav-${catId}`);
    if (activeNav) activeNav.classList.add('active');

    let filteredPosts = posts;
    let currentCatTitle = "TRANG CHỦ";

    if (catId !== 'home' && catId !== 'latest') {
        let foundCat = categories.find(c => c.id === catId);
        if (!foundCat) {
            categories.forEach(c => {
                if (c.children) {
                    let sub = c.children.find(s => s.id === catId);
                    if (sub) foundCat = sub;
                }
            });
        }
        if (foundCat) currentCatTitle = foundCat.title.toUpperCase();

        filteredPosts = posts.filter(p => {
            if (!p.category) return false;
            return p.category.toLowerCase().includes(catId.toLowerCase()) || 
                   p.category.toLowerCase().includes(currentCatTitle.toLowerCase());
        });
    } else if (catId === 'latest') {
        currentCatTitle = "TIN MỚI NHẤT";
    }

    filteredPosts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    if (filteredPosts.length === 0) {
        app.innerHTML = `<h2 class="section-title">${currentCatTitle}</h2><p style="margin-top:15px;">Chưa có bài viết nào trong chuyên mục này. Hãy bấm vào <b>Crawler Page</b> để cào thêm bài viết mới!</p>`;
        return;
    }

    // TÁCH ĐÚNG 1 BÀI LỚN BÊN TRÁI VÀ 2 BÀI NHỎ BÊN PHẢI
    const featuredLarge = filteredPosts[0];
    const featuredSmall = filteredPosts.slice(1, 3); // Lấy đúng 2 bài nhỏ
    const remainingPosts = filteredPosts.slice(3);   // Các bài còn lại xếp dọc bên dưới

    let html = `<h2 class="section-title">${currentCatTitle}</h2>`;

    // GRID NỔI BẬT (1 LỚN BÊN TRÁI - 2 NHỎ BÊN PHẢI)
    html += `<div class="featured-grid">`;

    // 1 BÀI VIẾT LỚN BÊN TRÁI (FEATURED POST)
    if (featuredLarge) {
        html += `
            <div class="card featured-large" onclick="renderArticleDetail('${featuredLarge.id}')">
                ${featuredLarge.thumbnail ? `<img src="${featuredLarge.thumbnail}" class="card-img-large" alt="thumb">` : ''}
                <div class="card-body">
                    <div class="card-category">${featuredLarge.category}</div>
                    <h3 class="card-title">${featuredLarge.title}</h3>
                    <p class="card-excerpt">${featuredLarge.excerpt}</p>
                    <div class="card-meta">Đăng ngày: ${featuredLarge.publishedAt} | Tác giả: ${featuredLarge.author}</div>
                </div>
            </div>
        `;
    }

    // 2 BÀI VIẾT NHỎ BÊN PHẢI
    html += `<div class="featured-small-group">`;
    featuredSmall.forEach(post => {
        html += `
            <div class="card card-small" onclick="renderArticleDetail('${post.id}')">
                ${post.thumbnail ? `<img src="${post.thumbnail}" class="card-img-small" alt="thumb">` : ''}
                <div class="card-body">
                    <div class="card-category">${post.category}</div>
                    <h4 class="card-title-small">${post.title}</h4>
                    <div class="card-meta">${post.publishedAt}</div>
                </div>
            </div>
        `;
    });
    html += `</div></div>`; // Đóng featured-small-group và featured-grid

    // DANH SÁCH BÀI VIẾT CÒN LẠI XẾP DỌC BÊN DƯỚI
    if (remainingPosts.length > 0) {
        html += `<h3 style="margin: 25px 0 15px; font-size:18px; font-weight:bold;">Các tin khác</h3><div class="recent-list">`;
        remainingPosts.forEach(post => {
            html += `
                <div class="list-item" onclick="renderArticleDetail('${post.id}')">
                    ${post.thumbnail ? `<img src="${post.thumbnail}" class="list-item-img" alt="thumb">` : ''}
                    <div class="list-content">
                        <div class="card-category" style="color:#008837; font-weight:bold; font-size:12px; margin-bottom:4px;">${post.category}</div>
                        <h4 style="margin: 5px 0; font-size:16px; color:#111;">${post.title}</h4>
                        <p style="font-size: 13px; color: #666; margin-bottom: 8px;">${post.excerpt}</p>
                        <span class="card-meta" style="font-size:12px; color:#888;">${post.publishedAt} - Tác giả: ${post.author}</span>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    app.innerHTML = html;
}
