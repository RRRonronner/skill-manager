// Skill 数据类型定义 - 学习 TypeScript 的好例子

export interface Skill {
  /** Skill 唯一标识 */
  id: string;
  /** Skill 名称 */
  name: string;
  /** Skill 描述 */
  description: string;
  /** 是否启用 */
  enabled: boolean;
  /** 分类标签 */
  tags: string[];
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

export interface SkillFormData {
  name: string;
  description: string;
  tags: string[];
}

export interface AppConfig {
  /** Electron 应用配置 */
  version: string;
  /** 本地数据存储路径 */
  dataPath: string;
}

export interface IpcChannels {
  'skill:getAll': () => Skill[];
  'skill:create': (data: SkillFormData) => Skill;
  'skill:update': (id: string, data: Partial<SkillFormData>) => Skill | null;
  'skill:delete': (id: string) => boolean;
  'skill:toggle': (id: string) => Skill | null;
  'app:getPath': (name: string) => string;
}
