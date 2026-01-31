#!/usr/bin/env node
/**
 * AIOS Daemon Runner
 *
 * This script is spawned as a detached process to run the daemon in background.
 * It receives configuration via command line argument.
 */

import { AIOSDaemon, DaemonConfig } from './index';

async function main() {
  // Parse config from command line
  const configJson = process.argv[2];
  if (!configJson) {
    console.error('No configuration provided');
    process.exit(1);
  }

  let config: DaemonConfig;
  try {
    config = JSON.parse(configJson);
  } catch (error) {
    console.error('Invalid configuration JSON');
    process.exit(1);
  }

  // Create and start daemon
  const daemon = new AIOSDaemon(config);

  daemon.on('error', (error) => {
    console.error('Daemon error:', (error as Error).message);
  });

  daemon.on('log', ({ level, message, timestamp }) => {
    // In background mode, could write to a log file
    if (level === 'error') {
      console.error(`[${timestamp}] ${message}`);
    }
  });

  try {
    await daemon.start();

    // Keep process running
    process.on('SIGTERM', async () => {
      await daemon.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      await daemon.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start daemon:', (error as Error).message);
    process.exit(1);
  }
}

main();
