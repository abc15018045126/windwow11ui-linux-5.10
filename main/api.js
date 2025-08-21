const express = require('express');
const cors = require('cors');
const os = require('os');
const fs = require('fs');
const path = require('path');
const {FS_ROOT} = require('./constants');
const fsRouter = require('./filesystem');
const {launchExternalAppByPath} = require('./launcher');
const {API_PORT} = require('./constants');

function startApiServer() {
  const apiApp = express();
  apiApp.use(cors());
  apiApp.use(express.json({limit: '50mb'}));

  // API endpoint to provide the API key
  apiApp.get('/api/get-key', (req, res) => {
    res.json({apiKey: process.env.API_KEY});
  });

  apiApp.get('/api/os-user', (req, res) => {
    try {
      res.json({username: os.userInfo().username});
    } catch (error) {
      console.error('API Error getting OS user:', error);
      res.status(500).json({error: 'Failed to get OS username'});
    }
  });

  // App Discovery Endpoint
  apiApp.get('/api/apps', async (req, res) => {
    try {
      const appsDir = path.join(FS_ROOT, 'components', 'apps');
      const entries = await fs.promises.readdir(appsDir, {withFileTypes: true});

      const tsxFiles = new Set(
        entries
          .filter(e => e.isFile() && e.name.endsWith('App.tsx'))
          .map(e => e.name),
      );

      const appPromises = entries
        .filter(entry => entry.isDirectory())
        .map(async dir => {
          try {
            const packageJsonPath = path.join(
              appsDir,
              dir.name,
              'package.json',
            );
            await fs.promises.access(packageJsonPath); // Check if package.json exists

            const content = await fs.promises.readFile(
              packageJsonPath,
              'utf-8',
            );
            const pkg = JSON.parse(content);

            const isInstalled = tsxFiles.has(`${dir.name}App.tsx`);

            return {
              id: dir.name.toLowerCase(),
              name: dir.name,
              description: pkg.description || 'A discovered application.',
              version: pkg.version || '1.0.0',
              isExternal: true,
              path: path.join('components', 'apps', dir.name),
              isInstalled: isInstalled,
            };
          } catch (e) {
            // Ignore directories that are not valid apps (e.g., no package.json)
            return null;
          }
        });

      const apps = (await Promise.all(appPromises)).filter(Boolean);
      res.json(apps);
    } catch (error) {
      console.error('API Error getting app list:', error);
      res.status(500).json({error: 'Failed to get app list'});
    }
  });

  // Endpoint to "install" an app by creating its .tsx file
  apiApp.post('/api/install', async (req, res) => {
    const {id, name, path: appPath} = req.body;
    if (!id || !name || !appPath) {
      return res
        .status(400)
        .json({error: 'Missing required app details for installation.'});
    }

    const componentName = `${name}App`;
    const tsxFilePath = path.join(
      FS_ROOT,
      'components',
      'apps',
      `${componentName}.tsx`,
    );

    const tsxContent = `
import React from 'react';
import { AppDefinition, AppComponentProps } from '../../window/types';
import { HyperIcon } from '../../window/constants'; // Using a generic icon

const ${componentName}: React.FC<AppComponentProps> = () => {
  // This component can be minimal as it's for an external app
  return null;
};

export const appDefinition: AppDefinition = {
  id: '${id}',
  name: '${name}',
  icon: 'hyper', // Assign a generic icon name as a string
  isExternal: true,
  externalPath: '${appPath}',
  component: ${componentName},
};

export default ${componentName};
`;

    try {
      await fs.promises.writeFile(tsxFilePath, tsxContent.trim());
      console.log(`Successfully created ${tsxFilePath}`);
      res.status(201).json({success: true, message: `App ${name} installed.`});
    } catch (error) {
      console.error(`Failed to write TSX file for ${name}:`, error);
      res.status(500).json({error: `Failed to install app ${name}.`});
    }
  });

  // New route to launch external apps
  apiApp.post('/api/launch', (req, res) => {
    const {path: relativeAppPath, args} = req.body;
    if (!relativeAppPath) {
      return res.status(400).json({error: 'Missing path in request body'});
    }

    const success = launchExternalAppByPath(relativeAppPath, args);

    if (success) {
      res.json({success: true, message: 'App launch initiated.'});
    } else {
      res.status(500).json({error: 'Failed to launch application.'});
    }
  });

  // All filesystem APIs are prefixed with /api/fs
  apiApp.use('/api/fs', fsRouter);

  apiApp.listen(API_PORT, () => {
    console.log(`✅ API server listening on http://localhost:${API_PORT}`);
  });
}

module.exports = {startApiServer};
