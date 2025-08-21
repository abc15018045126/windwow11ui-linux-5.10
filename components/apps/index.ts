import type {AppDefinition} from '../../window/types';

let appDefinitions: AppDefinition[] | null = null;

// A type guard to check if a module has an appDefinition
function hasAppDefinition(
  module: any,
): module is {appDefinition: AppDefinition} {
  return (
    module &&
    typeof module.appDefinition === 'object' &&
    module.appDefinition !== null
  );
}

export const getAppDefinitions = async (): Promise<AppDefinition[]> => {
  if (appDefinitions) {
    return appDefinitions;
  }

  // Use import.meta.glob to dynamically find all App.tsx files
  const appModules = import.meta.glob([
    './*App.tsx',
    '../../window/components/**/*App.tsx',
    '../../window/components/*App.tsx',
  ]);

  const definitions: AppDefinition[] = [];
  for (const path in appModules) {
    const module = await appModules[path]();
    if (hasAppDefinition(module)) {
      definitions.push(module.appDefinition);
    }
  }

  // Manually add the external Chrome5 app definition, as it doesn't have a .tsx file
  // and cannot be discovered by the glob pattern.
  const chrome5AppDefinition: AppDefinition = {
    id: 'chrome5',
    name: 'Chrome 5',
    icon: 'chrome5',
    component: () => null, // Dummy component for external app
    isExternal: true,
    externalPath: 'components/apps/Chrome5/main.js',
  };
  definitions.push(chrome5AppDefinition);

  // Cache the definitions so we don't reload them on every call
  appDefinitions = definitions.sort((a, b) => a.name.localeCompare(b.name));

  return appDefinitions;
};
