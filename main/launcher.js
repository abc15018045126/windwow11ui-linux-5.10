const path = require('path');
const {spawn} = require('child_process');
const {FS_ROOT} = require('./constants');

function launchExternalAppByPath(webContents, appDef, args = []) {
  try {
    const appDir = path.join(FS_ROOT, appDef.externalPath);
    const appName = path.basename(appDir);

    const spawnArgs = [appDir, '--launched-by-host', ...args];

    console.log(
      `[Launcher] Spawning: ${process.execPath} ${spawnArgs.join(' ')}`,
    );

    const child = spawn(process.execPath, spawnArgs, {
      detached: true,
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_PATH: path.resolve(FS_ROOT, 'node_modules'),
      },
    });

    const pid = child.pid;
    if (!pid) {
      console.error(`[Launcher] Failed to get PID for ${appName}.`);
      child.kill();
      return;
    }

    console.log(`[Launcher] Launched ${appName} with PID: ${pid}`);
    webContents.send('app-launched', {...appDef, pid});

    child.stdout.on('data', data => {
      console.log(`[${appName}] [pid:${pid}] stdout: ${data}`);
    });

    child.stderr.on('data', data => {
      console.error(`[${appName}] [pid:${pid}] stderr: ${data}`);
    });

    child.on('error', err => {
      console.error(
        `[Launcher] Failed to start subprocess for ${appName} [pid:${pid}]. Error: ${err.message}`,
      );
    });

    child.on('exit', (code, signal) => {
      console.log(
        `[Launcher] Subprocess for ${appName} [pid:${pid}] exited with code ${code}, signal ${signal}`,
      );
      webContents.send('app-closed', pid);
    });

    child.unref();
  } catch (error) {
    console.error(
      `Error launching external app for path ${appDef.externalPath}:`,
      error,
    );
  }
}

module.exports = {launchExternalAppByPath};
