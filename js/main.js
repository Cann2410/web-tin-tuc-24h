// === HIỂN THỊ KHUNG 1 BÀI LỚN BÊN TRÁI + 2 BÀI NHỎ BÊN PHẢI CHUẨN 100% THEO ẢNH ===
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
        app.innerHTML = `<h2 class="section-title">${currentCatTitle}</h2><p style="margin-top:15px;">Chưa có bài viết nào trong chuyên mục này.</p>`;
        return;
    }

    // 1 BÀI LỚN BÊN TRÁI + 2 BÀI NHỎ BÊN PHẢI
    const featuredLarge = filteredPosts[0];
    const featuredSmall = filteredPosts.slice(1, 3);
    const remainingPosts = filteredPosts.slice(3);

    let html = `<h2 class="section-title">${currentCatTitle}</h2>`;

    // GRID BÀI VIẾT NỔI BẬT (ĐÚNG THEO ẢNH MẪU)
    html += `<div class="featured-grid">`;

    // CỘT TRÁI: 1 BÀI LỚN
    if (featuredLarge) {
        const defaultImg = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop";
        html += `
            <div class="card-clean" onclick="renderArticleDetail('${featuredLarge.id}')">
                <img src="${featuredLarge.thumbnail || defaultImg}" class="card-img-large" alt="thumb">
                <div class="card-category-green">${featuredLarge.category || 'THỜI SỰ'}</div>
                <h3 class="card-title-large-green">${featuredLarge.title}</h3>
                <p class="card-excerpt-clean">${featuredLarge.excerpt}</p>
            </div>
        `;
    }

    // CỘT PHẢI: 2 BÀI NHỎ (ẢNH TRÊN, TIÊU ĐỀ VÀ NGÀY GIỜ BÊN DƯỚI)
    html += `<div class="featured-small-group">`;
    featuredSmall.forEach(post => {
        const defaultImgSmall = "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&auto=format&fit=crop";
        html += `
            <div class="card-clean" onclick="renderArticleDetail('${post.id}')">
                <img src="${post.thumbnail || defaultImgSmall}" class="card-img-small" alt="thumb">
                <h4 class="card-title-small-clean">${post.title}</h4>
                <div class="card-time-clean">${post.publishedAt}</div>
            </div>
        `;
    });
    html += `</div></div>`; // Đóng featured-small-group và featured-grid

    // CÁC BÀI VIẾT CÒN LẠI XẾP DỌC BÊN DƯỚI
    if (remainingPosts.length > 0) {
        html += `<h3 style="margin: 30px 0 15px; font-size:18px; font-weight:bold;">Các tin khác</h3><div class="recent-list">`;
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
