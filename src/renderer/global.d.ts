// 渲染进程全局类型声明

interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface SkillFormData {
  name: string;
  description: string;
  tags: string[];
}

interface ShopSkill {
  id: string;
  name: string;
  description: string;
  source: 'official' | 'github';
  url?: string;
  author?: string;
  stars?: number;
}

interface ElectronAPI {
  getSkills: () => Promise<Skill[]>;
  getSkillContent: (id: string) => Promise<string | null>;
  createSkill: (data: SkillFormData) => Promise<Skill>;
  updateSkill: (id: string, data: Partial<SkillFormData>) => Promise<Skill | null>;
  deleteSkill: (id: string) => Promise<boolean>;
  toggleSkill: (id: string) => Promise<Skill | null>;
  getAppPath: (name: string) => Promise<string>;
  // 商店相关 API
  getOfficialSkills: () => Promise<ShopSkill[]>;
  searchGithub: (query: string) => Promise<ShopSkill[]>;
  downloadSkill: (skill: ShopSkill) => Promise<{ success: boolean; message: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
