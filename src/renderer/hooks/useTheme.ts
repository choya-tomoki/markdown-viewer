import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export function useTheme() {
  const theme = useAppStore((s) => s.theme);
  const fontFamily = useAppStore((s) => s.fontFamily);
  const fontSize = useAppStore((s) => s.fontSize);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--editor-font-family', fontFamily);
    document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
  }, [fontFamily, fontSize]);

  return theme;
}
