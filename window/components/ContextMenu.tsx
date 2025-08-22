import React, {useEffect, useRef, useState} from 'react';

export type ContextMenuItem =
  | {type: 'item'; label: string; onClick: () => void; disabled?: boolean}
  | {type: 'separator'}
  | {
      type: 'submenu';
      label: string;
      submenu: ContextMenuItem[];
      disabled?: boolean;
    };

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  isSubMenu?: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  onClose,
  isSubMenu = false,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<number | null>(null);
  const subMenuLeaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSubMenu) return; // Only top-level menu should have outside click handler

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, isSubMenu]);

  const handleItemClick = (onClick: () => void) => {
    onClick();
    onClose(); // Close the entire menu tree on item click
  };

  const handleSubMenuEnter = (index: number) => {
    if (subMenuLeaveTimer.current) {
      clearTimeout(subMenuLeaveTimer.current);
    }
    setActiveSubMenu(index);
  };

  const handleSubMenuLeave = () => {
    subMenuLeaveTimer.current = setTimeout(() => {
      setActiveSubMenu(null);
    }, 200); // A small delay to allow moving mouse to submenu
  };

  const menuWidth = 192;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const menuHeight = items.reduce(
    (acc, item) => acc + (item.type === 'separator' ? 9 : 30),
    12,
  );

  let finalX = x;
  let finalY = y;

  if (isSubMenu) {
    if (x + menuWidth * 2 > screenWidth) {
      finalX = x - menuWidth; // Open to the left
    } else {
      finalX = x + menuWidth; // Open to the right
    }
    finalY = y - 6; // Align with parent item
  } else {
    if (x + menuWidth > screenWidth) finalX = screenWidth - menuWidth - 5;
    if (y + menuHeight > screenHeight) finalY = screenHeight - menuHeight - 5;
  }

  return (
    <div
      ref={menuRef}
      style={{top: `${finalY}px`, left: `${finalX}px`}}
      className="fixed bg-black/80 backdrop-blur-xl border border-zinc-700 rounded-md shadow-lg py-1.5 w-48 text-sm text-zinc-100 z-[60] animate-fade-in-fast"
      onClick={e => e.stopPropagation()}
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={index} className="h-px bg-zinc-700 my-1.5" />;
        }
        if (item.type === 'submenu') {
          return (
            <div
              key={index}
              className="relative"
              onMouseEnter={() => handleSubMenuEnter(index)}
              onMouseLeave={handleSubMenuLeave}
            >
              <button
                disabled={item.disabled}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm flex items-center justify-between"
              >
                <span>{item.label}</span>
                <span className="text-xs">▶</span>
              </button>
              {activeSubMenu === index && (
                <ContextMenu
                  x={finalX}
                  y={finalY + index * 30} // Approximate position
                  items={item.submenu}
                  onClose={onClose}
                  isSubMenu
                />
              )}
            </div>
          );
        }
        return (
          <button
            key={index}
            onClick={() => handleItemClick(item.onClick)}
            disabled={item.disabled}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm flex items-center"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;
