"use strict";
// 渲染进程 - 前端逻辑
// 学习 TypeScript: 接口、类型、DOM操作、事件处理
// 当前状态
let allSkills = [];
let currentFilter = 'all';
let currentSearch = '';
let editingSkillId = null;
let currentView = 'list';
let currentShopTab = 'official';
let officialSkills = [];
let githubSearchResults = [];
// DOM 元素引用
const elements = {
    skillsList: document.getElementById('skills-list'),
    emptyState: document.getElementById('empty-state'),
    toolbar: document.querySelector('.toolbar'),
    searchInput: document.getElementById('search-input'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    skillForm: document.getElementById('skill-form'),
    skillId: document.getElementById('skill-id'),
    skillName: document.getElementById('skill-name'),
    skillDescription: document.getElementById('skill-description'),
    skillTags: document.getElementById('skill-tags'),
    btnAll: document.getElementById('btn-all'),
    btnEnabled: document.getElementById('btn-enabled'),
    btnDisabled: document.getElementById('btn-disabled'),
    btnAdd: document.getElementById('btn-add'),
    btnRefresh: document.getElementById('btn-refresh'),
    modalClose: document.getElementById('modal-close'),
    btnCancel: document.getElementById('btn-cancel'),
    // 详情弹窗
    detailModal: document.getElementById('detail-modal'),
    detailTitle: document.getElementById('detail-title'),
    detailContent: document.getElementById('detail-content'),
    detailClose: document.getElementById('detail-close'),
    // 商店页面
    shopPage: document.getElementById('shop-page'),
    btnShop: document.getElementById('btn-shop'),
    tabOfficial: document.getElementById('tab-official'),
    tabGithub: document.getElementById('tab-github'),
    officialSection: document.getElementById('official-section'),
    githubSection: document.getElementById('github-section'),
    officialList: document.getElementById('official-list'),
    githubList: document.getElementById('github-list'),
    githubSearchInput: document.getElementById('github-search-input'),
    githubSearchBtn: document.getElementById('github-search-btn'),
    githubLoading: document.getElementById('github-loading'),
    githubEmpty: document.getElementById('github-empty')
};
// 初始化
async function init() {
    console.log('初始化应用...');
    await loadSkills();
    await loadOfficialSkills();
    bindEvents();
    render();
}
// 加载官方推荐 Skills
async function loadOfficialSkills() {
    try {
        officialSkills = await window.electronAPI.getOfficialSkills();
        console.log(`加载了 ${officialSkills.length} 个官方 skills`);
        renderOfficialSkills();
    }
    catch (error) {
        console.error('加载官方 skills 失败:', error);
    }
}
// 加载 Skills
async function loadSkills() {
    try {
        allSkills = await window.electronAPI.getSkills();
        console.log(`加载了 ${allSkills.length} 个 skills`);
    }
    catch (error) {
        console.error('加载失败:', error);
        allSkills = [];
    }
}
// 绑定事件
function bindEvents() {
    // 导航按钮
    elements.btnAll.addEventListener('click', () => setFilter('all'));
    elements.btnEnabled.addEventListener('click', () => setFilter('enabled'));
    elements.btnDisabled.addEventListener('click', () => setFilter('disabled'));
    // 搜索
    elements.searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        render();
    });
    // 新建按钮
    elements.btnAdd.addEventListener('click', () => openModal());
    // 刷新按钮
    elements.btnRefresh.addEventListener('click', async () => {
        await loadSkills();
        render();
    });
    // 弹窗关闭
    elements.modalClose.addEventListener('click', closeModal);
    elements.btnCancel.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) {
            closeModal();
        }
    });
    // 表单提交
    elements.skillForm.addEventListener('submit', handleFormSubmit);
    // 详情弹窗关闭
    elements.detailClose.addEventListener('click', closeDetailModal);
    elements.detailModal.addEventListener('click', (e) => {
        if (e.target === elements.detailModal) {
            closeDetailModal();
        }
    });
    // ===== 商店相关事件 =====
    // 切换到商店页面
    elements.btnShop.addEventListener('click', () => switchView('shop'));
    // 切换回列表页面
    elements.btnAll.addEventListener('click', () => switchView('list'));
    elements.btnEnabled.addEventListener('click', () => switchView('list'));
    elements.btnDisabled.addEventListener('click', () => switchView('list'));
    // 商店标签切换
    elements.tabOfficial.addEventListener('click', () => setShopTab('official'));
    elements.tabGithub.addEventListener('click', () => setShopTab('github'));
    // GitHub 搜索
    elements.githubSearchBtn.addEventListener('click', handleGithubSearch);
    elements.githubSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleGithubSearch();
        }
    });
}
// 设置过滤器
function setFilter(filter) {
    currentFilter = filter;
    // 更新按钮状态
    elements.btnAll.classList.toggle('active', filter === 'all');
    elements.btnEnabled.classList.toggle('active', filter === 'enabled');
    elements.btnDisabled.classList.toggle('active', filter === 'disabled');
    render();
}
// 获取过滤后的 Skills
function getFilteredSkills() {
    let filtered = allSkills;
    // 按状态过滤
    if (currentFilter === 'enabled') {
        filtered = filtered.filter(s => s.enabled);
    }
    else if (currentFilter === 'disabled') {
        filtered = filtered.filter(s => !s.enabled);
    }
    // 搜索过滤
    if (currentSearch) {
        filtered = filtered.filter(s => s.name.toLowerCase().includes(currentSearch) ||
            s.description.toLowerCase().includes(currentSearch) ||
            s.tags.some(t => t.toLowerCase().includes(currentSearch)));
    }
    return filtered;
}
// 渲染列表
function render() {
    const filtered = getFilteredSkills();
    if (filtered.length === 0) {
        elements.skillsList.innerHTML = '';
        elements.emptyState.classList.remove('hidden');
    }
    else {
        elements.emptyState.classList.add('hidden');
        elements.skillsList.innerHTML = filtered.map(skill => createSkillCard(skill)).join('');
        // 绑定卡片内的事件
        bindCardEvents();
    }
}
// 创建 Skill 卡片 HTML
function createSkillCard(skill) {
    const tagsHtml = skill.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
    return `
    <div class="skill-card" data-id="${skill.id}">
      <div class="skill-info">
        <div class="skill-name">${escapeHtml(skill.name)}</div>
        <div class="skill-description">${escapeHtml(skill.description)}</div>
        <div class="skill-tags">${tagsHtml}</div>
      </div>
      <div class="skill-actions">
        <button class="view-btn" data-view="${skill.id}" title="查看详情">查看</button>
        <label class="toggle-switch">
          <input type="checkbox" ${skill.enabled ? 'checked' : ''} data-toggle="${skill.id}">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  `;
}
// 绑定卡片内的事件
function bindCardEvents() {
    // 切换开关
    document.querySelectorAll('[data-toggle]').forEach(toggle => {
        toggle.addEventListener('change', async (e) => {
            const id = e.target.getAttribute('data-toggle');
            if (id) {
                await toggleSkill(id);
            }
        });
    });
    // 查看详情（点击 skill-info 部分）
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-view');
            const skill = allSkills.find(s => s.id === id);
            if (id && skill) {
                openDetailModal(id, skill.name);
            }
        });
    });
}
// 切换 Skill 启用状态
async function toggleSkill(id) {
    try {
        await window.electronAPI.toggleSkill(id);
        await loadSkills();
        render();
    }
    catch (error) {
        console.error('切换失败:', error);
    }
}
// 删除 Skill
async function deleteSkill(id) {
    try {
        await window.electronAPI.deleteSkill(id);
        await loadSkills();
        render();
    }
    catch (error) {
        console.error('删除失败:', error);
    }
}
// 打开弹窗
function openModal(editId) {
    editingSkillId = editId || null;
    if (editId) {
        const skill = allSkills.find(s => s.id === editId);
        if (skill) {
            elements.modalTitle.textContent = '编辑 Skill';
            elements.skillId.value = skill.id;
            elements.skillName.value = skill.name;
            elements.skillDescription.value = skill.description;
            elements.skillTags.value = skill.tags.join(', ');
        }
    }
    else {
        elements.modalTitle.textContent = '新建 Skill';
        elements.skillForm.reset();
        elements.skillId.value = '';
    }
    elements.modal.classList.remove('hidden');
    elements.skillName.focus();
}
// 关闭弹窗
function closeModal() {
    elements.modal.classList.add('hidden');
    editingSkillId = null;
}
// 打开详情弹窗
async function openDetailModal(skillId, skillName) {
    elements.detailTitle.textContent = skillName;
    elements.detailContent.textContent = '加载中...';
    elements.detailModal.classList.remove('hidden');
    try {
        const content = await window.electronAPI.getSkillContent(skillId);
        if (content) {
            elements.detailContent.textContent = content;
        }
        else {
            elements.detailContent.textContent = '无法加载内容';
        }
    }
    catch (error) {
        console.error('加载详情失败:', error);
        elements.detailContent.textContent = '加载失败';
    }
}
// 关闭详情弹窗
function closeDetailModal() {
    elements.detailModal.classList.add('hidden');
}
// 处理表单提交
async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = {
        name: elements.skillName.value.trim(),
        description: elements.skillDescription.value.trim(),
        tags: elements.skillTags.value.split(',').map(t => t.trim()).filter(t => t)
    };
    try {
        if (editingSkillId) {
            // 更新
            await window.electronAPI.updateSkill(editingSkillId, formData);
        }
        else {
            // 创建
            await window.electronAPI.createSkill(formData);
        }
        closeModal();
        await loadSkills();
        render();
    }
    catch (error) {
        console.error('保存失败:', error);
        alert('保存失败，请重试');
    }
}
// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// ===== 商店相关函数 =====
// 切换视图
function switchView(view) {
    currentView = view;
    if (view === 'shop') {
        elements.shopPage.classList.remove('hidden');
        elements.skillsList.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
        elements.toolbar.classList.add('hidden');
        elements.btnShop.classList.add('active');
    }
    else {
        elements.shopPage.classList.add('hidden');
        elements.skillsList.classList.remove('hidden');
        elements.toolbar.classList.remove('hidden');
        elements.btnShop.classList.remove('active');
        render();
    }
}
// 设置商店标签
function setShopTab(tab) {
    currentShopTab = tab;
    elements.tabOfficial.classList.toggle('active', tab === 'official');
    elements.tabGithub.classList.toggle('active', tab === 'github');
    if (tab === 'official') {
        elements.officialSection.classList.remove('hidden');
        elements.githubSection.classList.add('hidden');
    }
    else {
        elements.officialSection.classList.add('hidden');
        elements.githubSection.classList.remove('hidden');
    }
}
// 渲染官方推荐 Skills
function renderOfficialSkills() {
    elements.officialList.innerHTML = officialSkills.map(skill => createShopSkillCard(skill)).join('');
    bindShopCardEvents();
}
// 创建商店 Skill 卡片 HTML
function createShopSkillCard(skill) {
    const starsHtml = skill.stars ? `<span class="skill-stars">★ ${skill.stars}</span>` : '';
    const authorHtml = skill.author ? `<span class="skill-author">by ${escapeHtml(skill.author)}</span>` : '';
    return `
    <div class="shop-skill-card" data-id="${skill.id}">
      <div class="shop-skill-info">
        <div class="shop-skill-name">${escapeHtml(skill.name)}</div>
        <div class="shop-skill-description">${escapeHtml(skill.description)}</div>
        <div class="shop-skill-meta">${authorHtml}${starsHtml}</div>
      </div>
      <div class="shop-skill-actions">
        <button class="download-btn" data-download='${JSON.stringify(skill).replace(/'/g, "&#39;")}'>下载</button>
      </div>
    </div>
  `;
}
// 绑定商店卡片事件
function bindShopCardEvents() {
    document.querySelectorAll('[data-download]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const data = e.target.getAttribute('data-download');
            if (data) {
                try {
                    const skill = JSON.parse(data.replace(/&#39;/g, "'"));
                    await downloadSkill(skill);
                }
                catch (error) {
                    console.error('解析 skill 数据失败:', error);
                }
            }
        });
    });
}
// 下载 Skill
async function downloadSkill(skill) {
    try {
        const result = await window.electronAPI.downloadSkill(skill);
        if (result.success) {
            alert(`"${skill.name}" 下载成功！`);
            // 刷新列表
            await loadSkills();
        }
        else {
            alert(result.message);
        }
    }
    catch (error) {
        console.error('下载失败:', error);
        alert('下载失败，请重试');
    }
}
// 处理 GitHub 搜索
async function handleGithubSearch() {
    const query = elements.githubSearchInput.value.trim();
    if (!query) {
        return;
    }
    elements.githubLoading.classList.remove('hidden');
    elements.githubList.classList.add('hidden');
    elements.githubEmpty.classList.add('hidden');
    try {
        githubSearchResults = await window.electronAPI.searchGithub(query);
        elements.githubLoading.classList.add('hidden');
        if (githubSearchResults.length > 0) {
            elements.githubList.innerHTML = githubSearchResults.map(skill => createShopSkillCard(skill)).join('');
            elements.githubList.classList.remove('hidden');
            bindShopCardEvents();
        }
        else {
            elements.githubEmpty.classList.remove('hidden');
        }
    }
    catch (error) {
        console.error('搜索失败:', error);
        elements.githubLoading.classList.add('hidden');
        elements.githubEmpty.classList.remove('hidden');
    }
}
// 启动
document.addEventListener('DOMContentLoaded', init);
//# sourceMappingURL=renderer.js.map