let links = JSON.parse(localStorage.getItem('nav-links')) || Array.from({length: 12}, (_, i) => ({
    name: "Evan's Space", 
    url: "https://www.evan.xin", 
    category: "博客", 
    description: "keep it real", 
    status: "normal",
    logo: "https://www.evan.xin/logo.png"
}));
let categories = JSON.parse(localStorage.getItem('categories')) || ["博客", "工具", "资源", "娱乐"];
const PART1 = "admin";
const PART2 = "123";
const ENCRYPTED_ADMIN_PASSWORD = btoa(PART1 + PART2);
const SALT = "rainbow_salt_2023";
let currentPage = 1;
const itemsPerPage = 10;
let totalPages = Math.ceil(links.length / itemsPerPage);

function renderFrontend(category = "all") {
    const container = document.getElementById('nav-links');
    const filteredLinks = category === "all" 
        ? links 
        : links.filter(link => link.category === category);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLinks = filteredLinks.slice(startIndex, endIndex);

    container.innerHTML = paginatedLinks.map(link => {
        const encodeHTML = (str) => str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag]));
            
        return `
            <li class="nav-item">
                <a href="${link.url}" class="nav-link" target="_blank">
                    ${link.logo ? `<img src="${link.logo}" class="link-logo" alt="${encodeHTML(link.name)}">` : ''}
                    <div class="link-info">
                        <div class="link-name">${encodeHTML(link.name)}</div>
                        <div class="link-desc">${encodeHTML(link.description)}</div>
                    </div>
                </a>
                <span class="status-badge ${link.status === 'normal' ? 'status-normal' : 'status-error'}">
                    ${link.status === 'normal' ? '正常' : '维护'}
                </span>
            </li>
        `;
    }).join('');

    updateCategoryFilters(category);
    updatePaginationButtons();
}

function updateCategoryFilters(activeCategory = "all") {
    const container = document.getElementById('category-filters');
    container.innerHTML = `
        <button class="category-btn ${activeCategory === 'all' ? 'active' : ''}" data-category="all">全部</button>
    `;

    categories.forEach(cat => {
        container.innerHTML += `
            <button class="category-btn ${activeCategory === cat ? 'active' : ''}" data-category="${cat}">
                ${cat} (${links.filter(link => link.category === cat).length})
            </button>
        `;
    });

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPage = 1;
            renderFrontend(this.dataset.category);
        });
    });
}

function showAdmin() {
    document.querySelector('.frontend').style.display = 'none';
    document.querySelector('.backend').style.display = 'block';
    renderAdmin();
    renderCategories();
    loadFooterInfo();
    loadWebsiteSettings();
}

function showFrontend() {
    document.querySelector('.backend').style.display = 'none';
    document.querySelector('.frontend').style.display = 'block';
    renderFrontend();
    loadWebsiteLogo();
    loadWebsiteTitle();
}

// 密码
async function encryptPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(SALT + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function login() {
    const password = document.getElementById('admin-password').value;
    const encryptedPassword = await encryptPassword(password);
    const storedPassword = localStorage.getItem('admin-password') || await encryptPassword(atob(ENCRYPTED_ADMIN_PASSWORD));
    
    if(encryptedPassword === storedPassword) {
        document.querySelector('.login-form').style.display = 'none';
        document.querySelector('.admin-panel').style.display = 'block';
    } else {
        alert('密码错误！');
    }
}

function renderAdmin() {
    const tbody = document.getElementById('links-list');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLinks = links.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedLinks.map((link, index) => {
        const encodeHTML = (str) => str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag]));
            
        return `
            <tr>
                <td>
                    <div class="form-group">
                        <input value="${encodeHTML(link.name)}" placeholder="名称">
                    </div>
                </td>
                <td>
                    <div class="form-group">
                        <input value="${encodeHTML(link.url)}" placeholder="网址">
                    </div>
                </td>
                <td>
                    <div class="form-group">
                        <select>
                            ${categories.map(cat => 
                                `<option value="${encodeHTML(cat)}" ${link.category === cat ? 'selected' : ''}>${encodeHTML(cat)}</option>`
                            ).join('')}
                        </select>
                    </div>
                </td>
                <td>
                    <div class="form-group">
                        <textarea>${encodeHTML(link.description)}</textarea>
                    </div>
                </td>
                <td>
                    <div class="form-group">
                        <select onchange="updateStatus(${startIndex + index}, this.value)">
                            <option value="normal" ${link.status === 'normal' ? 'selected' : ''}>正常</option>
                            <option value="error" ${link.status !== 'normal' ? 'selected' : ''}>维护</option>
                        </select>
                    </div>
                </td>
                <td>
                    <div class="form-group">
                        <input type="text" placeholder="https://example.com/logo.png" value="${encodeHTML(link.logo || '')}">
                    </div>
                </td>
                <td>
                    <div class="form-group">
                        <button class="btn-primary" onclick="saveLink(${startIndex + index})">保存</button>
                        <button class="btn-danger" onclick="deleteLink(${startIndex + index})">删除</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');


    updatePaginationButtons();
}

function renderCategories() {
    const container = document.getElementById('categories-list');
    container.innerHTML = categories.map((cat, index) => {
        const encodeHTML = (str) => str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag]));
            
        return `
            <div class="category-item">
                <span>${encodeHTML(cat)}</span>
                <button onclick="deleteCategory(${index})">✕</button>
            </div>
        `;
    }).join('');
}

function loadFooterInfo() {
    const footerInfo = localStorage.getItem('footer-info') || '© 2025 My Website Favorites. Designer: evan.xin';
    document.getElementById('footer-text').value = footerInfo;
    document.getElementById('footer-info').innerHTML = `<p>${footerInfo}</p>`;
}

function loadWebsiteSettings() {
    const websiteLogo = localStorage.getItem('website-logo') || '';
    const websiteTitle = localStorage.getItem('website-title') || 'My Website Favorites';
    document.getElementById('website-logo-input').value = websiteLogo;
    document.getElementById('website-title-input').value = websiteTitle;
}

function saveWebsiteSettings() {
    const websiteLogo = document.getElementById('website-logo-input').value;
    const websiteTitle = document.getElementById('website-title-input').value;
    localStorage.setItem('website-logo', websiteLogo);
    localStorage.setItem('website-title', websiteTitle);
    loadWebsiteLogo();
    loadWebsiteTitle();
}

function loadWebsiteLogo() {
    const websiteLogo = localStorage.getItem('website-logo') || '';
    const logoImg = document.getElementById('website-logo');
    
    if (websiteLogo) {
        logoImg.src = websiteLogo;
        logoImg.style.display = 'block';
    } else {
        logoImg.style.display = 'none';
    }
}

function loadWebsiteTitle() {
    const websiteTitle = localStorage.getItem('website-title') || 'My Website Favorites';
    document.querySelector('.logo-container h1').textContent = websiteTitle;
    document.title = websiteTitle;
}

function saveFooterInfo() {
    const footerInfo = document.getElementById('footer-text').value;
    localStorage.setItem('footer-info', footerInfo);
    document.getElementById('footer-info').innerHTML = `<p>${footerInfo}</p>`;
}

function addNewLink() {
    links.push({ 
        name: "新链接", 
        url: "https://", 
        category: categories[0], 
        description: "", 
        status: "normal",
        logo: ""
    });
    localStorage.setItem('nav-links', JSON.stringify(links));
    currentPage = Math.ceil(links.length / itemsPerPage);
    renderAdmin();
}

function saveLink(index) {
    const row = document.querySelectorAll('#links-list tr')[index - ((currentPage - 1) * itemsPerPage)];
    if (!row) return;

    // 验证输入内容
    const name = row.querySelector('td:first-child input').value.trim();
    const url = row.querySelector('td:nth-child(2) input').value.trim();
    const category = row.querySelector('td:nth-child(3) select').value;
    const description = row.querySelector('td:nth-child(4) textarea').value.trim();
    const status = row.querySelector('td:nth-child(5) select').value;
    const logo = row.querySelector('td:nth-child(6) input').value.trim();

    if (!name || !url || !category) {
        alert('名称、网址和分类不能为空！');
        return;
    }

    links[index] = {
        name,
        url,
        category,
        description,
        status,
        logo
    };
    localStorage.setItem('nav-links', JSON.stringify(links));
    renderFrontend();
    renderAdmin();
}

function deleteLink(index) {
    if(confirm('确认删除该链接？')) {
        links.splice(index, 1);
        localStorage.setItem('nav-links', JSON.stringify(links));
        currentPage = Math.max(1, Math.min(currentPage, Math.ceil(links.length / itemsPerPage)));
        renderAdmin();
        renderFrontend();
    }
}

function updateStatus(index, status) {
    links[index].status = status;
    localStorage.setItem('nav-links', JSON.stringify(links));
    renderFrontend();
    renderAdmin();
}

function addNewCategory() {
    const categoryName = document.getElementById('new-category').value.trim();
    if (!categoryName) {
        alert('分类名称不能为空！');
        return;
    }

    // 验证输入内容
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(categoryName)) {
        alert('分类名称只能包含字母、数字和中文！');
        return;
    }

    if (!categories.includes(categoryName)) {
        categories.push(categoryName);
        localStorage.setItem('categories', JSON.stringify(categories));
        renderCategories();
        document.getElementById('new-category').value = '';
        renderFrontend();
    } else {
        alert('该分类已存在！');
    }
}

function deleteCategory(index) {
    if(confirm('确认删除该分类？此操作不会删除链接，只会将链接分类重置为第一个分类')) {
        const deletedCategory = categories[index];
        categories.splice(index, 1);
        localStorage.setItem('categories', JSON.stringify(categories));
        
        // 更新链接分类
        links.forEach(link => {
            if(link.category === deletedCategory) {
                link.category = categories[0] || "未分类";
            }
        });
        localStorage.setItem('nav-links', JSON.stringify(links));
        
        renderCategories();
        renderAdmin();
        renderFrontend();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderFrontend();
        renderAdmin();
    }
}

function nextPage() {
    if (currentPage * itemsPerPage < links.length) {
        currentPage++;
        renderFrontend();
        renderAdmin();
    }
}

function updatePaginationButtons() {
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage * itemsPerPage >= links.length;
    document.getElementById('admin-prev-page').disabled = currentPage === 1;
    document.getElementById('admin-next-page').disabled = currentPage * itemsPerPage >= links.length;
}

async function changePassword() {
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!oldPassword || !newPassword || !confirmPassword) {
        alert('所有字段不能为空！');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('新密码和确认密码不一致！');
        return;
    }

    const encryptedOldPassword = await encryptPassword(oldPassword);
    const storedPassword = localStorage.getItem('admin-password') || await encryptPassword(atob(ENCRYPTED_ADMIN_PASSWORD));

    if (encryptedOldPassword !== storedPassword) {
        alert('旧密码错误！');
        return;
    }

    localStorage.setItem('admin-password', await encryptPassword(newPassword));
    alert('密码修改成功！');
    document.getElementById('old-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
}

function exportLinks() {
    const data = JSON.stringify(links, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'links_export.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importLinks(file) {
    if (!file || file.type !== 'application/json') {
        alert('请选择有效的JSON文件！');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedLinks = JSON.parse(e.target.result);
            if (!Array.isArray(importedLinks)) {
                throw new Error('导入数据格式不正确！');
            }

            importedLinks.forEach(link => {
                if (!link.name || !link.url || !link.category) {
                    throw new Error('导入数据格式不正确！');
                }
            });

            links = importedLinks;
            localStorage.setItem('nav-links', JSON.stringify(links));
            renderAdmin();
            renderFrontend();
            alert('链接导入成功！');
        } catch (error) {
            alert('导入失败，请检查文件格式是否正确。');
        }
    };
    reader.readAsText(file);
}

renderFrontend();
loadWebsiteLogo();
loadWebsiteTitle();
