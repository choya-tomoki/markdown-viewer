import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Tab } from './Tab';
import { useTabStore } from '../../stores/tabStore';
import './TabBar.css';

export function TabBar() {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const closeTab = useTabStore((s) => s.closeTab);
  const reorderTabs = useTabStore((s) => s.reorderTabs);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTabs(String(active.id), String(over.id));
    }
  };

  const handleMouseDown = (tabId: string, event: React.MouseEvent) => {
    if (event.button === 1) {
      event.preventDefault();
      closeTab(tabId);
    }
  };

  if (tabs.length === 0) return <div className="tab-bar tab-bar--empty" />;

  return (
    <div className="tab-bar">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tabs.map((t) => t.id)}
          strategy={horizontalListSortingStrategy}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onClick={() => setActiveTab(tab.id)}
              onClose={() => closeTab(tab.id)}
              onMouseDown={(e) => handleMouseDown(tab.id, e)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
