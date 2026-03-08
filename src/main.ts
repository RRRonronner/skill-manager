import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { Skill, SkillFormData } from './types';

// 存储路径
const userDataPath = app.getPath('userData');
const dataFilePath = path.join(userDataPath, 'skills.json');

// 窗口引用
let mainWindow: BrowserWindow | null = null;

// 初始化/读取数据
function loadSkills(): Skill[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载技能数据失败:', error);
  }
  // 返回示例数据
  return getDefaultSkills();
}

// 保存数据
function saveSkills(skills: Skill[]): void {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(skills, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存技能数据失败:', error);
  }
}

// 默认技能列表
function getDefaultSkills(): Skill[] {
  return [
    {
      id: '1',
      name: 'git-commit',
      description: '帮助创建规范的 Git 提交',
      enabled: true,
      tags: ['git', '工具'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'github-pr',
      description: '创建和管理 GitHub Pull Request',
      enabled: true,
      tags: ['github', '协作'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'write-doc',
      description: '帮助撰写技术文档',
      enabled: false,
      tags: ['文档', '写作'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

// 创建窗口
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Skill 管理器',
    show: false
  });

  // 加载 HTML
  mainWindow.loadFile(path.join(__dirname, '../src/renderer/index.html'));

  // 显示后置
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    console.log('窗口已显示');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 注册 IPC 处理器
function registerIpcHandlers(): void {
  // 获取所有 skills
  ipcMain.handle('skill:getAll', () => {
    return loadSkills();
  });

  // 创建 skill
  ipcMain.handle('skill:create', (_event, data: SkillFormData) => {
    const skills = loadSkills();
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      tags: data.tags,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    skills.push(newSkill);
    saveSkills(skills);
    return newSkill;
  });

  // 更新 skill
  ipcMain.handle('skill:update', (_event, id: string, data: Partial<SkillFormData>) => {
    const skills = loadSkills();
    const index = skills.findIndex(s => s.id === id);
    if (index !== -1) {
      skills[index] = { ...skills[index], ...data, updatedAt: new Date().toISOString() };
      saveSkills(skills);
      return skills[index];
    }
    return null;
  });

  // 删除 skill
  ipcMain.handle('skill:delete', (_event, id: string) => {
    const skills = loadSkills();
    const filtered = skills.filter(s => s.id !== id);
    if (filtered.length !== skills.length) {
      saveSkills(filtered);
      return true;
    }
    return false;
  });

  // 切换启用状态
  ipcMain.handle('skill:toggle', (_event, id: string) => {
    const skills = loadSkills();
    const skill = skills.find(s => s.id === id);
    if (skill) {
      skill.enabled = !skill.enabled;
      skill.updatedAt = new Date().toISOString();
      saveSkills(skills);
      return skill;
    }
    return null;
  });

  // 获取应用路径
  ipcMain.handle('app:getPath', (_event, name: string) => {
    return app.getPath(name as any);
  });
}

// 应用就绪
app.whenReady().then(() => {
  console.log('应用启动中...');
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
