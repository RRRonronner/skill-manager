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

interface ElectronAPI {
  getSkills: () => Promise<Skill[]>;
  createSkill: (data: SkillFormData) => Promise<Skill>;
  updateSkill: (id: string, data: Partial<SkillFormData>) => Promise<Skill | null>;
  deleteSkill: (id: string) => Promise<boolean>;
  toggleSkill: (id: string) => Promise<Skill | null>;
  getAppPath: (name: string) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
