import { create } from 'zustand';

interface EditorState {
  scrollPositions: Record<string, number>;
  setScrollPosition: (filePath: string, position: number) => void;
  getScrollPosition: (filePath: string) => number;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  scrollPositions: {},
  setScrollPosition: (filePath, position) =>
    set((state) => ({
      scrollPositions: { ...state.scrollPositions, [filePath]: position },
    })),
  getScrollPosition: (filePath) => get().scrollPositions[filePath] ?? 0,
}));
