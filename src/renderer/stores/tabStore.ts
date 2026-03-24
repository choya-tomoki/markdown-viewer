import { create } from 'zustand';
import type { TabData } from '../../shared/appTypes';

interface TabState {
  tabs: TabData[];
  activeTabId: string | null;
  openTab: (tab: TabData) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  markTabDirty: (tabId: string) => void;
  markTabClean: (tabId: string) => void;
  reorderTabs: (fromId: string, toId: string) => void;
  getActiveTab: () => TabData | undefined;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tab) =>
    set((state) => {
      const existing = state.tabs.find((t) => t.id === tab.id);
      if (existing) {
        return { activeTabId: tab.id };
      }
      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      };
    }),

  closeTab: (tabId) =>
    set((state) => {
      const index = state.tabs.findIndex((t) => t.id === tabId);
      const newTabs = state.tabs.filter((t) => t.id !== tabId);
      let newActiveId = state.activeTabId;

      if (state.activeTabId === tabId) {
        if (newTabs.length > 0) {
          const newIndex = Math.min(index, newTabs.length - 1);
          newActiveId = newTabs[newIndex].id;
        } else {
          newActiveId = null;
        }
      }

      return { tabs: newTabs, activeTabId: newActiveId };
    }),

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  updateTabContent: (tabId, content) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, content } : t)),
    })),

  markTabDirty: (tabId) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, isDirty: true } : t)),
    })),

  markTabClean: (tabId) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, isDirty: false } : t)),
    })),

  reorderTabs: (fromId, toId) =>
    set((state) => {
      const tabs = [...state.tabs];
      const fromIndex = tabs.findIndex((t) => t.id === fromId);
      const toIndex = tabs.findIndex((t) => t.id === toId);
      if (fromIndex === -1 || toIndex === -1) return state;
      const [moved] = tabs.splice(fromIndex, 1);
      tabs.splice(toIndex, 0, moved);
      return { tabs };
    }),

  getActiveTab: () => {
    const state = get();
    return state.tabs.find((t) => t.id === state.activeTabId);
  },
}));
