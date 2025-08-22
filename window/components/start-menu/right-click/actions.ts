import { AppDefinition } from '../../../types';
import { createFile } from '../../../../services/filesystemService';

export const handleCreateShortcut = async (app: AppDefinition): Promise<void> => {
  const shortcutContent = {
    name: app.name,
    appId: app.id,
    icon: app.icon,
  };
  const fileName = `${app.name}.app`;
  try {
    // We can add a check here to see if the file already exists
    // and maybe prompt the user or create a unique name, but for now,
    // we'll just overwrite. A more robust solution would use `findUniqueName`.
    await createFile(
      '/Desktop',
      fileName,
      JSON.stringify(shortcutContent, null, 2)
    );
    // Optional: show a success notification to the user
  } catch (error) {
    console.error(`Failed to create shortcut for ${app.name}:`, error);
    // Optional: show an error notification to the user
  }
};
