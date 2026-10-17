// === 1. TẢI VÀ QUẢN LÝ DỮ LIỆU LOCALSTORAGE ===
async function loadInitialData() {
    try {
        const resMenu = await fetch('./data/menu.json');
        const dataMenu = await resMenu.json();
        if (dataMenu && dataMenu.menu) {
            localStorage.setItem('categories', JSON.stringify(dataMenu.menu));
        }
    } catch(e) { console.error("Lỗi tải menu.json:", e); }

    if (!localStorage.getItem('posts')) {
        try {
            const resPosts = await fetch('./data/posts.json');
            const posts = await resPosts.json();
            localStorage.setItem('posts', JSON.stringify(posts || []));
        } catch(e) { console.error("Lỗi tải posts.json:", e); }
    }
}

function getPosts() { return JSON.parse(localStorage.getItem('posts')) || []; }
function getCategories() { return JSON.parse(localStorage.getItem('categories')) || []; }

// LƯU BÀI VIẾT CRAWL ĐƯỢC VÀO LOCALSTORAGE
function savePostToStorage(newPost) {
    const posts = getPosts();
    const index = posts.findIndex(p => p.id === newPost.id);
    if (index >= 0) { 
        posts[index] = newPost; 
    } else { 
        posts.unshift(newPost); // Thêm bài mới lên đầu danh sách
    }
    localStorage.setItem('posts', JSON.stringify(posts));
}

// === 2.1 THANH ĐIỀU HƯỚNG (NAVBAR) ===
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

    // Nút chuyển sang Crawler Page riêng biệt
    navHtml += `<li><a onclick="renderCrawlerPage()" class="btn-crawler">Crawler Page</a></li>`;

    navMenuEl.innerHTML = navHtml;
    if(footerCatEl) footerCatEl.innerHTML = footerHtml;
}

// === 2.2 TRANG DANH SÁCH BÀI VIẾT THEO CHUYÊN MỤC ===
function renderCategory(catId = 'home') {
    const app = document.getElementById('appView');
    const posts = getPosts();
    const categories = getCategories();

    document.querySelectorAll('.nav-menu a').forEach(el => el.classList.remove('active'));
    const activeNav = document.getElementById(`nav-${catId}`);
    if (activeNav) activeNav.classList.add('active');

    let filteredPosts = posts;
    let currentCatTitle = "Trang chủ";

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
        if (foundCat) currentCatTitle = foundCat.title;

        filteredPosts = posts.filter(p => {
            if (!p.category) return false;
            return p.category.toLowerCase().includes(catId.toLowerCase()) || 
                   p.category.toLowerCase().includes(currentCatTitle.toLowerCase());
        });
    } else if (catId === 'latest') {
        currentCatTitle = "Tin Mới Nhất";
    }

    // Sắp xếp theo thời gian giảm dần (mới -> cũ)
    filteredPosts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    if (filteredPosts.length === 0) {
        app.innerHTML = `<h2 class="section-title">${currentCatTitle}</h2><p style="margin-top:15px;">Chưa có bài viết nào trong chuyên mục này. Hãy bấm vào <b>Crawler Page</b> để cào thêm bài viết mới!</p>`;
        return;
    }

    // Top section: 1 bài lớn bên trái + 2 bài nhỏ bên phải
    const featuredLarge = filteredPosts[0];
    const featuredSmall = filteredPosts.slice(1, 3);
    const remainingPosts = filteredPosts.slice(3);

    let html = `<h2 class="section-title">${currentCatTitle}</h2>`;

    html += `<div class="featured-grid">`;

    // 1 bài viết lớn bên trái (featured post)
    if (featuredLarge) {
        const defaultImg = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop";
        html += `
            <div class="card-featured-large" onclick="renderArticleDetail('${featuredLarge.id}')">
                <img src="${featuredLarge.thumbnail || defaultImg}" class="img-large" alt="thumb">
                <h3 class="title-large">${featuredLarge.title}</h3>
                <p class="excerpt-large">${featuredLarge.excerpt}</p>
            </div>
        `;
    }

    // 2 bài viết nhỏ bên phải
    html += `<div class="featured-small-group">`;
    featuredSmall.forEach(post => {
        const defaultImgSmall = "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=600&auto=format&fit=crop";
        html += `
            <div class="card-featured-small" onclick="renderArticleDetail('${post.id}')">
                <img src="${post.thumbnail || defaultImgSmall}" class="img-small" alt="thumb">
                <h4 class="title-small">${post.title}</h4>
            </div>
        `;
    });
    html += `</div></div>`;

    // Danh sách bài viết còn lại (Ảnh bên trái, Tiêu đề + Sapo bên phải)
    if (remainingPosts.length > 0) {
        html += `<div class="recent-list">`;
        remainingPosts.forEach(post => {
            const defaultImgList = "https://images.unsplash.com/photo-1517649763962-0c623266010b?w=600&auto=format&fit=crop";
            html += `
                <div class="list-item" onclick="renderArticleDetail('${post.id}')">
                    <img src="${post.thumbnail || defaultImgList}" class="list-img" alt="thumb">
                    <div class="list-content">
                        <h4 class="list-title">${post.title}</h4>
                        <p class="list-excerpt">${post.excerpt}</p>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    app.innerHTML = html;
}

// === TRANG CHI TIẾT BÀI VIẾT ===
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
                <div class="card-category" style="color:#008837; font-weight:bold; margin-bottom:5px;">Chuyên mục: ${article.category}</div>
                <h1 class="article-title-main">${article.title}</h1>
                <div class="article-meta-info">
                    <span>Tác giả: <b>${article.author}</b></span> |
                    <span>Thời gian đăng: ${article.publishedAt}</span> |
                    <span>Nguồn: ${article.source}</span>
                </div>
            </div>
            ${article.thumbnail ? `<img src="${article.thumbnail}" style="width:100%; max-height:450px; object-fit:cover; border-radius:6px; margin-bottom:20px;">` : ''}
            ${article.excerpt ? `<p class="article-excerpt-main">${article.excerpt}</p>` : ''}
            <div class="article-content-body">${article.content}</div>
            <br><hr><br>
            <a href="${article.url}" target="_blank" style="color: #008837; font-weight: bold;">[Xem bài viết gốc trên Dantri]</a>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === PHẦN 3: GIAO DIỆN TRANG CRAWLER PAGE ===
function renderCrawlerPage() {
    const app = document.getElementById('appView');
    document.querySelectorAll('.nav-menu a').forEach(el => el.classList.remove('active'));

    app.innerHTML = `
        <div class="crawler-box">
            <h2 class="section-title">Chức năng Crawler Tin Tức</h2>
            <p style="margin-bottom: 15px; color: #555;">Nhập URL bài viết từ website <b>Dantri.com.vn</b> để tự động bóc tách dữ liệu JSON:</p>
            
            <div class="form-group">
                <label for="crawlUrl">Đường dẫn bài viết (URL):</label>
                <input type="text" id="crawlUrl" placeholder="https://dantri.com.vn/bat-dong-san/ha-noi-tinh-co-che-boi-thuong-dat-dac-biet-cho-7-du-an-duong-sat-20260928122246655.htm">
            </div>
            <button class="btn-submit" onclick="handleCrawl()">Bắt đầu Cào Dữ Liệu</button>

            <div id="crawlerStatus" style="margin-top: 15px; font-weight: bold;"></div>
            
            <div id="jsonPreviewContainer" style="display:none;">
                <h3 style="margin-top: 20px; font-size: 18px;">Kết quả JSON Trích xuất (Chuẩn 10 trường đề bài):</h3>
                <pre class="json-preview" id="jsonPreview"></pre>
                <button class="btn-submit" style="background: #28a745; margin-top: 15px;" onclick="saveCrawledArticle()">Lưu Bài Viết Vào LocalStorage</button>
            </div>
        </div>
    `;
}

let tempCrawledPost = null;

// XỬ LÝ SỰ KIỆN CÀO DỮ LIỆU
async function handleCrawl() {
    const urlInput = document.getElementById('crawlUrl').value.trim();
    const statusEl = document.getElementById('crawlerStatus');
    const previewContainer = document.getElementById('jsonPreviewContainer');
    const jsonPreview = document.getElementById('jsonPreview');

    if (!urlInput) { alert("Vui lòng nhập đường dẫn URL!"); return; }

    statusEl.style.color = "orange";
    statusEl.innerText = "Đang kết nối và cào dữ liệu từ Dantri...";
    previewContainer.style.display = "none";

    const result = await getArticle(urlInput);

    if (result) {
        tempCrawledPost = result;
        statusEl.style.color = "green";
        statusEl.innerText = "Cào dữ liệu thành công!";
        jsonPreview.innerText = JSON.stringify(result, null, 2);
        previewContainer.style.display = "block";
    } else {
        statusEl.style.color = "red";
        statusEl.innerText = "Không thể cào bài viết. Vui lòng kiểm tra lại đường dẫn URL!";
    }
}

// XỬ LÝ LƯU BÀI VIẾT VÀO LOCALSTORAGE
function saveCrawledArticle() {
    if (tempCrawledPost) {
        savePostToStorage(tempCrawledPost);
        alert("Đã lưu bài viết thành công vào LocalStorage!");
        renderCategory('home'); // Quay lại trang chủ hiển thị bài viết mới
    }
}

window.onload = async function() {
    await loadInitialData();
    renderNavbar();
    renderCategory('home');
};
