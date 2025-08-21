import React, {useState, useMemo, useContext} from 'react';
import {DiscoveredAppDefinition, AppContext} from '../contexts/AppContext';
import Icon from './icon';
import {useTheme} from '../theme';

interface StartMenuProps {
  onOpenApp: (app: DiscoveredAppDefinition) => void;
  onClose: () => void;
}

const StartMenu: React.FC<StartMenuProps> = ({onOpenApp, onClose}) => {
  const {apps} = useContext(AppContext);
  const [isShowingAllApps, setIsShowingAllApps] = useState(false);
  const {theme} = useTheme();

  const pinnedApps = useMemo(
    () => apps.filter(app => app.isPinned).slice(0, 12),
    [apps],
  );
  const recommendedApps = useMemo(
    () => apps.filter(app => !app.isPinned).slice(0, 6),
    [apps],
  );
  const sortedApps = useMemo(
    () => [...apps].sort((a, b) => a.name.localeCompare(b.name)),
    [apps],
  );

  return (
    <div
      className={`start-menu-container fixed bottom-[52px] left-1/2 transform -translate-x-1/2 
                 w-[580px] h-[650px] rounded-lg shadow-2xl 
                 flex flex-col p-6 z-40 ${theme.startMenu.background} ${theme.startMenu.textColor}`}
      onClick={e => e.stopPropagation()}
    >
      <div className="mb-6 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Type here to search"
            className={`w-full rounded-md py-2.5 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${theme.startMenu.searchBar}`}
          />
          <Icon
            iconName="search"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400"
          />
        </div>
      </div>

      <div className="flex-grow overflow-hidden">
        {isShowingAllApps ? (
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">All Apps</h2>
              <button
                onClick={() => setIsShowingAllApps(false)}
                className={`px-3 py-1 text-xs bg-zinc-800/80 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.startMenu.buttonHover}`}
              >
                &lt; Back
              </button>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar -mr-4 pr-4">
              <div className="space-y-1">
                {sortedApps.map(app => (
                  <button
                    key={`all-${app.id}`}
                    onClick={() => {
                      onOpenApp(app);
                      onClose();
                    }}
                    className={`w-full flex items-center p-2 rounded-md transition-colors ${theme.startMenu.buttonHover}`}
                    title={app.name}
                  >
                    <Icon
                      iconName={app.icon}
                      className="w-6 h-6 mr-4 flex-shrink-0"
                    />
                    <span className="text-sm text-left truncate">
                      {app.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold opacity-80">Pinned</h2>
                <button
                  onClick={() => setIsShowingAllApps(true)}
                  className={`px-3 py-1 text-xs bg-zinc-800/80 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.startMenu.buttonHover}`}
                >
                  All apps &gt;
                </button>
              </div>
              <div className="grid grid-cols-6 gap-4">
                {pinnedApps.map(app => (
                  <button
                    key={app.id}
                    onClick={() => {
                      onOpenApp(app);
                      onClose();
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors aspect-square ${theme.startMenu.pinnedButton}`}
                    title={app.name}
                  >
                    <Icon iconName={app.icon} className="w-8 h-8 mb-1.5" />
                    <span className="text-xs text-center truncate w-full">
                      {app.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold opacity-80 mb-3">
                Recommended
              </h2>
              <div className="space-y-2">
                {recommendedApps.map(app => (
                  <button
                    key={`rec-${app.id}`}
                    onClick={() => {
                      onOpenApp(app);
                      onClose();
                    }}
                    className={`w-full flex items-center p-2 rounded-md transition-colors ${theme.startMenu.buttonHover}`}
                    title={app.name}
                  >
                    <Icon
                      iconName={app.icon}
                      className="w-6 h-6 mr-3 flex-shrink-0"
                    />
                    <span className="text-sm text-left truncate">
                      {app.name}
                    </span>
                  </button>
                ))}
                {recommendedApps.length === 0 && (
                  <p className="text-xs text-zinc-400">
                    No recommendations yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 mt-auto pt-4 border-t border-zinc-800/50 flex justify-between items-center">
        <button
          className={`flex items-center p-2 rounded-md ${theme.startMenu.buttonHover}`}
        >
          <Icon iconName="user" className="w-7 h-7 rounded-full mr-2" />
          <span className="text-sm">User</span>
        </button>
        <div className="flex space-x-1">
          <button
            title="Settings"
            onClick={() => {
              const settingsApp = apps.find(app => app.appId === 'settings');
              if (settingsApp) onOpenApp(settingsApp);
              onClose();
            }}
            className={`p-2 rounded-md ${theme.startMenu.buttonHover}`}
          >
            <Icon iconName="settings" className="w-5 h-5" />
          </button>
          <button
            title="Power (Placeholder)"
            className={`p-2 rounded-md ${theme.startMenu.buttonHover}`}
          >
            <Icon iconName="start" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartMenu;
