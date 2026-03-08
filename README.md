# Skill Manager

可视化管理 Claude Code Skills 的桌面应用。

## 功能特性

- **Skill 管理**：查看、筛选、启用/禁用本地 Claude Code Skills
- **商店**：浏览官方推荐 Skills，搜索并下载 GitHub 上的 Skills
- **详情查看**：查看 Skill 的完整内容（SKILL.md）
- **状态持久化**：自动保存 Skills 的启用/禁用状态

## 技术栈

- Electron + TypeScript
- 前端：原生 HTML/CSS/JS

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发
npm run dev

# 构建
npm run build:ts
npm start
```

## 项目结构

```
src/
├── main.ts          # Electron 主进程
├── preload.ts       # 预加载脚本
├── types.ts         # 类型定义
└── renderer/
    ├── index.html   # 页面结构
    ├── renderer.ts  # 渲染进程逻辑
    └── styles.css   # 样式
```

## 配置

- Skills 存储路径：`C:/Users/admin/.claude/skills`
- 配置文件：`%APPDATA%/skill-manager/skill-config.json`

## License

MIT
