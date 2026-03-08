import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { Skill, SkillFormData } from './types';

// Claude Code skills 目录
const claudeSkillsPath = 'C:/Users/admin/.claude/skills';

// 存储路径（用于保存用户自定义配置）
const userDataPath = app.getPath('userData');
const configFilePath = path.join(userDataPath, 'skill-config.json');

// 窗口引用
let mainWindow: BrowserWindow | null = null;

// 解析 SKILL.md 文件获取 name 和 description
function parseSkillFile(skillPath: string): { name: string; description: string } | null {
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    // 解析 YAML front matter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      const yaml = match[1];
      const nameMatch = yaml.match(/name:\s*(.+)/);
      const descMatch = yaml.match(/description:\s*(.+)/);
      if (nameMatch) {
        return {
          name: nameMatch[1].trim(),
          description: descMatch ? descMatch[1].trim() : ''
        };
      }
    }
    // 如果没有 YAML，使用目录名
    return {
      name: path.basename(skillPath),
      description: ''
    };
  } catch (error) {
    console.error(`解析 skill 文件失败: ${skillPath}`, error);
    return null;
  }
}

// 从 Claude Code skills 目录加载
function loadSkillsFromClaudeDir(): Skill[] {
  const skills: Skill[] = [];

  try {
    if (!fs.existsSync(claudeSkillsPath)) {
      console.log('Skills 目录不存在:', claudeSkillsPath);
      return getDefaultSkills();
    }

    const entries = fs.readdirSync(claudeSkillsPath);
    const userConfig = loadUserConfig();

    for (const entry of entries) {
      const skillPath = path.join(claudeSkillsPath, entry);
      const stat = fs.statSync(skillPath);

      // 只处理目录
      if (!stat.isDirectory()) continue;

      const parsed = parseSkillFile(skillPath);
      if (parsed) {
        skills.push({
          id: entry, // 使用目录名作为 ID
          name: parsed.name,
          description: parsed.description,
          enabled: userConfig[entry]?.enabled ?? true, // 从用户配置读取启用状态
          tags: [], // 可以后续添加自动标签
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    console.log(`加载了 ${skills.length} 个 skills`);
    return skills;
  } catch (error) {
    console.error('加载 skills 失败:', error);
    return getDefaultSkills();
  }
}

// 加载用户配置
function loadUserConfig(): Record<string, { enabled: boolean }> {
  try {
    if (fs.existsSync(configFilePath)) {
      const data = fs.readFileSync(configFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载用户配置失败:', error);
  }
  return {};
}

// 保存用户配置
function saveUserConfig(config: Record<string, { enabled: boolean }>): void {
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存用户配置失败:', error);
  }
}

// 初始化/读取数据
function loadSkills(): Skill[] {
  return loadSkillsFromClaudeDir();
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

  // 获取 skill 详情（读取 SKILL.md 完整内容）
  ipcMain.handle('skill:getContent', (_event, id: string) => {
    const skillPath = path.join(claudeSkillsPath, id, 'SKILL.md');
    try {
      if (fs.existsSync(skillPath)) {
        const content = fs.readFileSync(skillPath, 'utf-8');
        return content;
      }
    } catch (error) {
      console.error('读取 skill 内容失败:', error);
    }
    return null;
  });

  // 创建 skill（只读模式，返回提示）
  ipcMain.handle('skill:create', (_event, _data: SkillFormData) => {
    console.log('创建 skill 功能在只读模式下不可用');
    return null;
  });

  // 更新 skill（只读模式，返回提示）
  ipcMain.handle('skill:update', (_event, _id: string, _data: Partial<SkillFormData>) => {
    console.log('更新 skill 功能在只读模式下不可用');
    return null;
  });

  // 删除 skill（只读模式，返回提示）
  ipcMain.handle('skill:delete', (_event, _id: string) => {
    console.log('删除 skill 功能在只读模式下不可用');
    return false;
  });

  // 切换启用状态
  ipcMain.handle('skill:toggle', (_event, id: string) => {
    const skills = loadSkills();
    const skill = skills.find(s => s.id === id);
    if (skill) {
      skill.enabled = !skill.enabled;
      skill.updatedAt = new Date().toISOString();

      // 保存到用户配置
      const config = loadUserConfig();
      config[id] = { enabled: skill.enabled };
      saveUserConfig(config);

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
