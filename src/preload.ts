import { contextBridge, ipcRenderer } from 'electron';
import { Skill, SkillFormData } from './types';

// 暴露给渲染进程的 API
const electronAPI = {
  // 获取所有 skills
  getSkills: (): Promise<Skill[]> => {
    return ipcRenderer.invoke('skill:getAll');
  },

  // 获取 skill 详情内容
  getSkillContent: (id: string): Promise<string | null> => {
    return ipcRenderer.invoke('skill:getContent', id);
  },

  // 创建 skill
  createSkill: (data: SkillFormData): Promise<Skill> => {
    return ipcRenderer.invoke('skill:create', data);
  },

  // 更新 skill
  updateSkill: (id: string, data: Partial<SkillFormData>): Promise<Skill | null> => {
    return ipcRenderer.invoke('skill:update', id, data);
  },

  // 删除 skill
  deleteSkill: (id: string): Promise<boolean> => {
    return ipcRenderer.invoke('skill:delete', id);
  },

  // 切换启用状态
  toggleSkill: (id: string): Promise<Skill | null> => {
    return ipcRenderer.invoke('skill:toggle', id);
  },

  // 获取应用路径
  getAppPath: (name: string): Promise<string> => {
    return ipcRenderer.invoke('app:getPath', name);
  }
};

// 暴露到全局
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明 - 供渲染进程使用
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
