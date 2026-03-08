"use strict";
// 渲染进程 - 前端逻辑
// 学习 TypeScript: 接口、类型、DOM操作、事件处理
// 当前状态
let allSkills = [];
let currentFilter = 'all';
let currentSearch = '';
let editingSkillId = null;
// DOM 元素引用
const elements = {
    skillsList: document.getElementById('skills-list'),
    emptyState: document.getElementById('empty-state'),
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
    btnCancel: document.getElementById('btn-cancel')
};
// 初始化
async function init() {
    console.log('初始化应用...');
    await loadSkills();
    bindEvents();
    render();
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
        <label class="toggle-switch">
          <input type="checkbox" ${skill.enabled ? 'checked' : ''} data-toggle="${skill.id}">
          <span class="toggle-slider"></span>
        </label>
        <button class="icon-btn edit" data-edit="${skill.id}" title="编辑">✏️</button>
        <button class="icon-btn delete" data-delete="${skill.id}" title="删除">🗑️</button>
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
    // 编辑按钮
    document.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-edit');
            if (id) {
                openModal(id);
            }
        });
    });
    // 删除按钮
    document.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-delete');
            if (id && confirm('确定要删除这个 Skill 吗？')) {
                await deleteSkill(id);
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
// 启动
document.addEventListener('DOMContentLoaded', init);
//# sourceMappingURL=renderer.js.map