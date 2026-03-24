import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TabData } from '../../../shared/appTypes';

interface TabProps {
  tab: TabData;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function Tab({ tab, isActive, onClick, onClose, onMouseDown }: TabProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: tab.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`tab ${isActive ? 'tab--active' : ''} ${tab.isDirty ? 'tab--dirty' : ''}`}
      onClick={onClick}
      onMouseDown={onMouseDown}
      {...attributes}
      {...listeners}
    >
      <span className="tab__name">
        {tab.isDirty && <span className="tab__dirty-dot" />}
        {tab.name}
      </span>
      <button
        className="tab__close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="閉じる"
      >
        ×
      </button>
    </div>
  );
}
