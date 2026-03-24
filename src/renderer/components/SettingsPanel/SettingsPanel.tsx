import { useAppStore } from '../../stores/appStore';
import './SettingsPanel.css';

const FONT_OPTIONS = [
  { label: 'システムフォント', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif' },
  { label: 'Noto Sans JP', value: '"Noto Sans JP", "Noto Sans", sans-serif' },
  { label: 'Yu Gothic', value: '"Yu Gothic", "YuGothic", "Meiryo", sans-serif' },
  { label: 'Meiryo', value: '"Meiryo", "メイリオ", sans-serif' },
  { label: 'MS Gothic', value: '"MS Gothic", "ＭＳ ゴシック", monospace' },
  { label: 'Serif (明朝)', value: '"Yu Mincho", "YuMincho", "Hiragino Mincho Pro", "MS Mincho", serif' },
  { label: 'Monospace', value: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace' },
];

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 22, 24];

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const fontFamily = useAppStore((s) => s.fontFamily);
  const fontSize = useAppStore((s) => s.fontSize);
  const setFontFamily = useAppStore((s) => s.setFontFamily);
  const setFontSize = useAppStore((s) => s.setFontSize);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>設定</h3>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-body">
          {/* Theme section */}
          <div className="settings-section">
            <label className="settings-label">テーマ</label>
            <div className="theme-switcher">
              <button
                className={`theme-btn ${theme === 'light' ? 'theme-btn--active' : ''}`}
                onClick={() => useAppStore.getState().setTheme('light')}
              >
                ☀️ ライト
              </button>
              <button
                className={`theme-btn ${theme === 'dark' ? 'theme-btn--active' : ''}`}
                onClick={() => useAppStore.getState().setTheme('dark')}
              >
                🌙 ダーク
              </button>
            </div>
          </div>

          {/* Font family section */}
          <div className="settings-section">
            <label className="settings-label">フォント</label>
            <select
              className="settings-select"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font size section */}
          <div className="settings-section">
            <label className="settings-label">フォントサイズ</label>
            <div className="font-size-control">
              <button
                className="font-size-btn"
                onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                disabled={fontSize <= 10}
              >
                −
              </button>
              <select
                className="settings-select settings-select--small"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              >
                {FONT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
              <button
                className="font-size-btn"
                onClick={() => setFontSize(Math.min(32, fontSize + 1))}
                disabled={fontSize >= 32}
              >
                +
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="settings-section">
            <label className="settings-label">プレビュー</label>
            <div
              className="settings-preview"
              style={{ fontFamily, fontSize: `${fontSize}px` }}
            >
              The quick brown fox jumps over the lazy dog.
              <br />
              吾輩は猫である。名前はまだ無い。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
