import React, {useState, useEffect, useContext, useMemo} from 'react';
import {OpenApp} from '../types';
import {DiscoveredAppDefinition, AppContext} from '../contexts/AppContext';
import {TASKBAR_HEIGHT} from '../constants';
import {useTheme} from '../theme';
import Icon from './icon';

interface TaskbarProps {
  openApps: OpenApp[];
  activeAppInstanceId: string | null;
  onToggleStartMenu: () => void;
  onAppIconClick: (app: DiscoveredAppDefinition, instanceId?: string) => void;
}

const Taskbar: React.FC<TaskbarProps> = ({
  openApps,
  activeAppInstanceId,
  onToggleStartMenu,
  onAppIconClick,
}) => {
  const {apps: discoveredApps} = useContext(AppContext);
  const [currentTime, setCurrentTime] = useState(new Date());
  const {theme} = useTheme();

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const taskbarItems = useMemo(() => {
    const items = new Map<
      string,
      {appDef: DiscoveredAppDefinition; instance?: OpenApp}
    >();
    const openAppMap = new Map(openApps.map(app => [app.id, app]));

    const pinnedApps = discoveredApps.filter(app => app.isPinned);
    pinnedApps.forEach(appDef => {
      const key = appDef.appId || appDef.path!;
      items.set(key, {appDef, instance: openAppMap.get(key)});
    });

    openApps.forEach(openApp => {
      const key = openApp.id;
      if (!items.has(key)) {
        const appDef = discoveredApps.find(app => app.appId === key);
        if (appDef) {
          items.set(key, {appDef, instance: openApp});
        }
      }
    });

    return Array.from(items.values());
  }, [discoveredApps, openApps]);

  return (
    <div
      className={`flex items-center justify-between px-4 fixed bottom-0 left-0 right-0 z-50 ${theme.taskbar.background} ${theme.taskbar.textColor}`}
      style={{height: `${TASKBAR_HEIGHT}px`}}
    >
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="flex items-center space-x-2 h-full">
          <button
            onClick={onToggleStartMenu}
            className={`taskbar-start-button p-2 rounded h-full flex items-center ${theme.taskbar.buttonHover}`}
            aria-label="Start Menu"
          >
            <Icon iconName="start" className="w-5 h-5 text-blue-400" />
          </button>

          {taskbarItems.map(({appDef, instance}) => {
            const isActive =
              instance?.instanceId === activeAppInstanceId &&
              !instance?.isMinimized;
            const isMinimized = instance?.isMinimized;
            const isOpen = !!instance;

            return (
              <button
                key={appDef.id}
                onClick={() => onAppIconClick(appDef, instance?.instanceId)}
                className={`p-2 rounded h-[calc(100%-8px)] flex items-center relative transition-colors duration-150 ease-in-out
                            ${isActive ? theme.taskbar.activeButton : theme.taskbar.buttonHover}
                            ${isMinimized ? 'opacity-70' : ''}`}
                title={appDef.name}
              >
                <Icon iconName={appDef.icon} className="w-5 h-5" isSmall />
                {isOpen && (
                  <span
                    className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 rounded-t-sm
                                  ${isActive ? theme.taskbar.activeIndicator : isMinimized ? 'bg-gray-400' : 'bg-gray-500'}`}
                  ></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center space-x-3 text-xs">
        <div>
          {currentTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        <div>
          {currentTime.toLocaleDateString([], {month: 'short', day: 'numeric'})}
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
