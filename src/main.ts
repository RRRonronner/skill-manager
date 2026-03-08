import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import { Skill, SkillFormData } from './types';

// Claude Code skills 目录
const claudeSkillsPath = 'C:/Users/admin/.claude/skills';

// Shop Skill 数据类型
interface ShopSkill {
  id: string;
  name: string;
  description: string;
  source: 'official' | 'github';
  url?: string;
  author?: string;
  stars?: number;
}

// 官方推荐 Skills 列表
const officialSkills: ShopSkill[] = [
  {
    id: 'git-commit',
    name: 'git-commit',
    description: '帮助创建规范的 Git 提交信息，符合 conventional commits 标准',
    source: 'official',
    author: 'Anthropic'
  },
  {
    id: 'github-pr',
    name: 'github-pr',
    description: '创建和管理 GitHub Pull Request，包括审查、合并等操作',
    source: 'official',
    author: 'Anthropic'
  },
  {
    id: 'review-pr',
    name: 'review-pr',
    description: '审查 GitHub Pull Request，提供代码质量建议和改进意见',
    source: 'official',
    author: 'Anthropic'
  },
  {
    id: 'explain-code',
    name: 'explain-code',
    description: '解释代码的功能和实现原理，支持多种编程语言',
    source: 'official',
    author: 'Anthropic'
  },
  {
    id: 'write-tests',
    name: 'write-tests',
    description: '为代码编写单元测试和集成测试，支持多种测试框架',
    source: 'official',
    author: 'Anthropic'
  },
  {
    id: 'refactor-code',
    name: 'refactor-code',
    description: '重构代码以提高可读性和性能，保持功能不变',
    source: 'official',
    author: 'Anthropic'
  },
  {
    id: 'find-bugs',
    name: 'find-bugs',
    description: '静态分析代码，查找潜在的 bug 和安全问题',
    source: 'official',
    author: 'Anthropic'
  },
  {
    id: 'api-docs',
    name: 'api-docs',
    description: '为 API 生成规范的文档，支持 OpenAPI/Swagger 格式',
    source: 'official',
    author: 'Anthropic'
  }
];

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
    // 查找 name
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    // 查找 description
    const descMatch = content.match(/^description:\s*(.+)$/m);

    const name = nameMatch ? nameMatch[1].trim() : path.basename(skillPath);
    const description = descMatch ? descMatch[1].trim() : '';

    return { name, description };
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

  // ===== 商店相关 IPC =====

  // 获取官方推荐 Skills
  ipcMain.handle('shop:getOfficialSkills', () => {
    return officialSkills;
  });

  // 搜索 GitHub 仓库
  ipcMain.handle('shop:searchGithub', async (_event, query: string): Promise<ShopSkill[]> => {
    return new Promise((resolve) => {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+skill&sort=stars&order=desc&per_page=20`;

      const options = {
        headers: {
          'User-Agent': 'Skill-Manager-App'
        }
      };

      https.get(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.items) {
              const skills: ShopSkill[] = json.items.map((item: any) => ({
                id: item.id.toString(),
                name: item.name,
                description: item.description || '暂无描述',
                source: 'github' as const,
                url: item.html_url,
                author: item.owner.login,
                stars: item.stargazers_count
              }));
              resolve(skills);
            } else {
              resolve([]);
            }
          } catch (error) {
            console.error('解析 GitHub API 响应失败:', error);
            resolve([]);
          }
        });
      }).on('error', (error) => {
        console.error('GitHub API 请求失败:', error);
        resolve([]);
      });
    });
  });

  // 下载 Skill 到本地
  ipcMain.handle('shop:downloadSkill', async (_event, skill: ShopSkill): Promise<{ success: boolean; message: string }> => {
    try {
      // 确保目标目录存在
      if (!fs.existsSync(claudeSkillsPath)) {
        fs.mkdirSync(claudeSkillsPath, { recursive: true });
      }

      const skillDir = path.join(claudeSkillsPath, skill.name);

      // 如果目录已存在
      if (fs.existsSync(skillDir)) {
        return { success: false, message: '该 Skill 已存在' };
      }

      // 创建 skill 目录
      fs.mkdirSync(skillDir, { recursive: true });

      // 如果是 GitHub 仓库，尝试获取内容
      if (skill.source === 'github' && skill.url) {
        // 这里可以添加从 GitHub 获取 SKILL.md 的逻辑
        // 暂时创建基础文件
        const skillContent = `---
name: ${skill.name}
description: ${skill.description}
---

# ${skill.name}

${skill.description}

来源: ${skill.url}
作者: ${skill.author || '未知'}
`;

        fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillContent, 'utf-8');
      } else {
        // 官方 skill 创建基础文件
        const skillContent = `---
name: ${skill.name}
description: ${skill.description}
---

# ${skill.name}

${skill.description}
`;

        fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillContent, 'utf-8');
      }

      return { success: true, message: '下载成功' };
    } catch (error) {
      console.error('下载 Skill 失败:', error);
      return { success: false, message: '下载失败: ' + (error as Error).message };
    }
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
