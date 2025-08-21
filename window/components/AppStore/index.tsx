import React, {useState, useEffect, useCallback} from 'react';
import {AppComponentProps, AppDefinition} from '../../types';
import Icon from '../icon'; // Corrected path
// Assuming RefreshIcon and HyperIcon are decorative and can be replaced or defined
const RefreshIcon = ({className}: {className: string}) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h5M20 20v-5h-5M4 4l16 16"
    />
  </svg>
);
const HyperIcon = ({className}: {className: string}) => (
  <div className={className}>⚛️</div>
);
const AppStoreApp: React.FC<AppComponentProps> = ({setTitle}) => {
  const [availableApps, setAvailableApps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAvailableApps = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/apps');
      if (!response.ok) {
        throw new Error('Failed to fetch apps');
      }
      const apps = await response.json();
      setAvailableApps(apps);
    } catch (error) {
      console.error('Error fetching available apps:', error);
      alert(
        'Could not load apps from the store. Please ensure the backend is running.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setTitle('App Store');
  }, [setTitle]);

  const handleInstall = async (app: any) => {
    try {
      const response = await fetch('http://localhost:3001/api/install', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(app),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Installation failed');
      }
      alert(
        `App ${app.name} installed successfully! You may need to restart the application to see it in the Start Menu.`,
      );
      // Refresh the store's list to show the new "Installed" state
      fetchAvailableApps();
    } catch (error) {
      console.error('Error installing app:', error);
      alert(`Failed to install ${app.name}: ${error.message}`);
    }
  };

  return (
    <div className="p-6 text-zinc-200 h-full overflow-y-auto custom-scrollbar bg-zinc-900">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Icon iconName="appStore" className="w-10 h-10 text-blue-400 mr-4" />
          <div>
            <h1 className="text-2xl font-semibold text-white">App Store</h1>
            <p className="text-sm text-zinc-400">
              Discover and install new applications.
            </p>
          </div>
        </div>
        <button
          onClick={fetchAvailableApps}
          className="p-2 rounded-md hover:bg-zinc-700 transition-colors"
          title="Refresh app list"
        >
          <RefreshIcon className="w-5 h-5 text-zinc-300" />
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading applications...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableApps.map(app => (
            <div
              key={app.id}
              className="bg-zinc-800/50 p-4 rounded-lg flex items-center space-x-4"
            >
              <HyperIcon className="w-12 h-12 flex-shrink-0" />
              <div className="flex-grow overflow-hidden">
                <h2 className="font-semibold text-white truncate">
                  {app.name}
                </h2>
                <p className="text-xs text-zinc-400">Version {app.version}</p>
                <p className="text-xs text-zinc-500 truncate">
                  {app.description}
                </p>
              </div>
              <button
                onClick={() => handleInstall(app)}
                disabled={app.isInstalled}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  app.isInstalled
                    ? 'bg-zinc-700 text-zinc-400 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {app.isInstalled ? 'Installed' : 'Install'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// The 'appDefinition' should be in its own App.tsx file, not here.
// This component only defines the view.
export default AppStoreApp;
