// === 1. TẢI DỮ LIỆU TỪ DATA / LOCALSTORAGE ===
async function loadInitialData() {
    try {
        const resMenu = await fetch('./data/menu.json');
        const dataMenu = await resMenu.json();
        if (dataMenu && dataMenu.menu) {
            localStorage.setItem('categories', JSON.stringify(dataMenu.menu));
        }
    } catch(e) { console.error("Lỗi đọc menu.json:", e); }

    if (!localStorage.getItem('posts')) {
        try {
            const resPosts = await fetch('./data/posts.json');
            const posts = await resPosts.json();
            localStorage.setItem('posts', JSON.stringify(posts || []));
        } catch(e) { console.error("Lỗi đọc posts.json:", e); }
    }
}

function getPosts() { return JSON.parse(localStorage.getItem('posts')) || []; }
function getCategories() { return JSON.parse(localStorage.getItem('categories')) || []; }

function savePostToStorage(newPost) {
    const posts = getPosts();
    const index = posts.findIndex(p => p.id === newPost.id);
    if (index >= 0) { posts[index] = newPost; } 
    else { posts.unshift(newPost); }
    localStorage.setItem('posts', JSON.stringify(posts));
}

// === 2. THANH ĐIỀU HƯỚNG NAVBAR ===
function renderNavbar() {
    const categories = getCategories();
    const navMenuEl = document.getElementById('navbarMenu');
    const footerCatEl = document.getElementById('footerCategories');

    let navHtml = '';
    let footerHtml = '';

    categories.forEach(cat => {
        if (cat.children && cat.children.length > 0) {
            let subHtml = `<ul class="dropdown-menu">`;
            cat.children.forEach(child => {
                subHtml += `<li><a onclick="renderCategory('${child.id}')">${child.title}</a></li>`;
            });
            subHtml += `</ul>`;

            navHtml += `
                <li class="has-dropdown">
                    <a onclick="renderCategory('${cat.id}')" id="nav-${cat.id}">${cat.title} ▾</a>
                    ${subHtml}
                </li>
            `;
        } else {
            navHtml += `<li><a onclick="renderCategory('${cat.id}')" id="nav-${cat.id}">${cat.title}</a></li>`;
        }
        footerHtml += `<li><a onclick="renderCategory('${cat.id}')">${cat.title}</a></li>`;
    });

    navHtml += `<li><a onclick="renderCrawlerPage()" class="btn-crawler">Crawler Page</a></li>`;

    navMenuEl.innerHTML = navHtml;
    if(footerCatEl) footerCatEl.innerHTML = footerHtml;
}

// === 3. TRANG DANH SÁCH BÀI VIẾT (KHUNG MẪU BÀI VIẾT ẢNH 4) ===
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

    const featuredLarge = filteredPosts[0];
    const featuredSmall = filteredPosts.slice(1, 4); // 3 bài nhỏ
    const tamDiemPost = filteredPosts[4] || filteredPosts[1]; // Bài Tâm điểm
    const remainingPosts = filteredPosts.slice(5);

    let html = `<h2 class="section-title">${currentCatTitle}</h2>`;

    // GRID BÀI VIẾT (TỪ ẢNH 4)
    html += `<div class="featured-grid">`;

    // CỘT BÊN TRÁI: 1 BÀI LỚN
    if (featuredLarge) {
        const defaultImg = "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=800&auto=format&fit=crop";
        html += `
            <div class="featured-large" onclick="renderArticleDetail('${featuredLarge.id}')">
                <img src="${featuredLarge.thumbnail || defaultImg}" class="card-img-large" alt="thumb">
                <h3 class="card-title">${featuredLarge.title}</h3>
                <p class="card-excerpt">${featuredLarge.excerpt}</p>
            </div>
        `;
    }

    // CỘT BÊN PHẢI: 3 BÀI NHỎ + 1 BÀI TÂM ĐIỂM
    html += `<div class="featured-right-col">`;

    // 3 BÀI NHỎ
    featuredSmall.forEach(post => {
        const defaultImgSmall = "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop";
        html += `
            <div class="right-small-item" onclick="renderArticleDetail('${post.id}')">
                <h4 class="item-title">${post.title}</h4>
                <img src="${post.thumbnail || defaultImgSmall}" class="item-img" alt="thumb">
            </div>
        `;
    });

    // 1 BÀI TÂM ĐIỂM (CÓ ẢNH TÁC GIẢ TRÒN)
    if (tamDiemPost) {
        const avatarImg = tamDiemPost.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop";
        html += `
            <div class="tam-diem-box" onclick="renderArticleDetail('${tamDiemPost.id}')">
                <span class="tam-diem-badge">Tâm điểm</span>
                <div class="tam-diem-content">
                    <h4 class="tam-diem-title">${tamDiemPost.title}</h4>
                    <div class="tam-diem-author-box">
                        <img src="${avatarImg}" class="tam-diem-avatar" alt="avatar">
                        <span class="tam-diem-author-name">${tamDiemPost.author || 'Tác giả'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    html += `</div></div>`; // Đóng featured-right-col và featured-grid

    // BÀI VIẾT CÒN LẠI XẾP DỌC BÊN DƯỚI
    if (remainingPosts.length > 0) {
        html += `<h3 style="margin: 25px 0 15px; font-size:18px; font-weight:bold;">Các tin khác</h3><div class="recent-list">`;
        remainingPosts.forEach(post => {
            html += `
                <div class="list-item" onclick="renderArticleDetail('${post.id}')">
                    ${post.thumbnail ? `<img src="${post.thumbnail}" class="list-item-img" alt="thumb">` : ''}
                    <div class="list-content">
                        <div class="card-category" style="color:#008837; font-weight:bold; font-size:12px; margin-bottom:4px;">${post.category}</div>
                        <h4 style="margin: 5px 0; font-size:16px;">${post.title}</h4>
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

// === 4. TRANG CHI TIẾT ===
function renderArticleDetail(postId) {
    const app = document.getElementById('appView');
    const posts = getPosts();
    const article = posts.find(p => p.id === postId);

    if (!article) {
        app.innerHTML = `<h2>Bài viết không tồn tại</h2>`;
        return;
    }

    app.innerHTML = `
        <div class="article-detail">
            <div class="article-header">
                <div class="card-category" style="color:#008837; font-weight:bold;">${article.category}</div>
                <h1 class="article-title-main">${article.title}</h1>
                <div class="article-meta-info">
                    <span>Tác giả: <b>${article.author}</b></span> |
                    <span>Ngày đăng: ${article.publishedAt}</span> |
                    <span>Nguồn: ${article.source}</span>
                </div>
            </div>
            ${article.thumbnail ? `<img src="${article.thumbnail}" style="width:100%; max-height:450px; object-fit:cover; border-radius:8px; margin-bottom:20px;">` : ''}
            ${article.excerpt ? `<p class="article-excerpt-main">${article.excerpt}</p>` : ''}
            <div class="article-content-body">${article.content}</div>
            <br><hr><br>
            <a href="${article.url}" target="_blank" style="color: #008837; font-weight: bold;">[Xem bài viết gốc trên Dantri]</a>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === 5. TRANG CRAWLER PAGE ===
function renderCrawlerPage() {
    const app = document.getElementById('appView');
    app.innerHTML = `
        <div class="crawler-box">
            <h2 class="section-title">Chức năng Crawler Bài viết</h2>
            <p style="margin-bottom: 15px;">Nhập URL bài viết từ website Dantri.com.vn để tự động bóc tách dữ liệu:</p>
            
            <div class="form-group">
                <label for="crawlUrl">Đường dẫn bài viết (URL):</label>
                <input type="text" id="crawlUrl" placeholder="https://dantri.com.vn/thoi-su/tong-bi-thu-chu-tich-nuoc-phap-luat-phai-du-on-dinh-de-nguoi-dan-yen-tam-20260928141449559.htm">
            </div>
            <button class="btn-submit" onclick="handleCrawl()">Bắt đầu Cào Dữ Liệu</button>

            <div id="crawlerStatus" style="margin-top: 15px; font-weight: bold;"></div>
            <div id="jsonPreviewContainer" style="display:none;">
                <h3 style="margin-top: 20px;">Kết quả JSON Trích xuất:</h3>
                <pre class="json-preview" id="jsonPreview"></pre>
                <button class="btn-submit" style="background: #28a745; margin-top: 15px;" onclick="saveCrawledArticle()">Lưu Bài Viết Vào LocalStorage</button>
            </div>
        </div>
    `;
}

let tempCrawledPost = null;

async function handleCrawl() {
    const urlInput = document.getElementById('crawlUrl').value.trim();
    const statusEl = document.getElementById('crawlerStatus');
    const previewContainer = document.getElementById('jsonPreviewContainer');
    const jsonPreview = document.getElementById('jsonPreview');

    if (!urlInput) { alert("Vui lòng nhập URL!"); return; }

    statusEl.style.color = "orange";
    statusEl.innerText = "Đang cào dữ liệu bài viết...";
    previewContainer.style.display = "none";

    const result = await getArticle(urlInput);

    if (result) {
        tempCrawledPost = result;
        statusEl.style.color = "green";
        statusEl.innerText = "Trích xuất bài viết thành công!";
        jsonPreview.innerText = JSON.stringify(result, null, 2);
        previewContainer.style.display = "block";
    } else {
        statusEl.style.color = "red";
        statusEl.innerText = "Không thể cào bài viết. Vui lòng kiểm tra lại URL!";
    }
}

function saveCrawledArticle() {
    if (tempCrawledPost) {
        savePostToStorage(tempCrawledPost);
        alert("Đã lưu bài viết vào LocalStorage!");
        renderCategory('home');
    }
}

window.onload = async function() {
    await loadInitialData();
    renderNavbar();
    renderCategory('home');
};
