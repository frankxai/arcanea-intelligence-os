/**
 * AIOS Daemon - Background Service for Arcanea Intelligence OS
 *
 * Runs as a persistent background service that:
 * - Serves MCP protocol to any AI client (Claude Code, Cursor, OpenCode)
 * - Provides HTTP API for dashboards and web clients
 * - Watches workspace for artifacts
 * - Persists state in SQLite
 * - Manages plugins
 * - Syncs with cloud (optional)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import { EventEmitter } from 'events';

// =============================================================================
// DAEMON CONFIGURATION
// =============================================================================

export interface DaemonConfig {
  /** HTTP API port (default: 3333) */
  port: number;
  /** Host to bind to (default: 127.0.0.1 for security) */
  host: string;
  /** Path to SQLite database */
  dbPath: string;
  /** Paths to watch for artifacts */
  watchPaths: string[];
  /** Arcanea Studio path */
  studioPath: string;
  /** Enable cloud sync */
  cloudSync: boolean;
  /** Supabase URL (if cloud sync enabled) */
  supabaseUrl?: string;
  /** Supabase anon key (if cloud sync enabled) */
  supabaseKey?: string;
  /** Plugin directory */
  pluginDir: string;
  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** PID file path */
  pidFile: string;
}

export const DEFAULT_CONFIG: DaemonConfig = {
  port: 3333,
  host: '127.0.0.1',
  dbPath: path.join(process.env.HOME || process.env.USERPROFILE || '', '.arcanea', 'state.db'),
  watchPaths: [],
  studioPath: path.join(process.env.HOME || process.env.USERPROFILE || '', 'arcanea-studio'),
  cloudSync: false,
  pluginDir: path.join(process.env.HOME || process.env.USERPROFILE || '', '.arcanea', 'plugins'),
  logLevel: 'info',
  pidFile: path.join(process.env.HOME || process.env.USERPROFILE || '', '.arcanea', 'daemon.pid'),
};

// =============================================================================
// DAEMON STATE
// =============================================================================

export type DaemonStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

export interface DaemonState {
  status: DaemonStatus;
  pid: number | null;
  startedAt: Date | null;
  config: DaemonConfig;
  connections: {
    mcp: number;
    http: number;
  };
  plugins: {
    loaded: number;
    active: number;
  };
  errors: string[];
}

// =============================================================================
// DAEMON CLASS
// =============================================================================

export class AIOSDaemon extends EventEmitter {
  private config: DaemonConfig;
  private state: DaemonState;
  private httpServer: net.Server | null = null;
  private mcpServer: any = null;
  private watcher: any = null;
  private db: any = null;

  constructor(config: Partial<DaemonConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      status: 'stopped',
      pid: null,
      startedAt: null,
      config: this.config,
      connections: { mcp: 0, http: 0 },
      plugins: { loaded: 0, active: 0 },
      errors: [],
    };
  }

  /**
   * Get current daemon state
   */
  getState(): DaemonState {
    return { ...this.state };
  }

  /**
   * Start the daemon
   */
  async start(): Promise<void> {
    if (this.state.status === 'running') {
      throw new Error('Daemon is already running');
    }

    this.state.status = 'starting';
    this.emit('status', this.state.status);

    try {
      // Ensure directories exist
      await this.ensureDirectories();

      // Check if another instance is running
      if (await this.isAlreadyRunning()) {
        throw new Error('Another daemon instance is already running');
      }

      // Write PID file
      await this.writePidFile();

      // Initialize database
      await this.initDatabase();

      // Load plugins
      await this.loadPlugins();

      // Start HTTP server
      await this.startHttpServer();

      // Start file watcher
      await this.startWatcher();

      this.state.status = 'running';
      this.state.pid = process.pid;
      this.state.startedAt = new Date();
      this.emit('status', this.state.status);
      this.emit('started');

      this.log('info', `AIOS Daemon started on ${this.config.host}:${this.config.port}`);
    } catch (error) {
      this.state.status = 'error';
      this.state.errors.push((error as Error).message);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the daemon gracefully
   */
  async stop(): Promise<void> {
    if (this.state.status !== 'running') {
      return;
    }

    this.state.status = 'stopping';
    this.emit('status', this.state.status);

    try {
      // Stop watcher
      if (this.watcher) {
        await this.watcher.stop();
        this.watcher = null;
      }

      // Close HTTP server
      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          this.httpServer!.close(() => resolve());
        });
        this.httpServer = null;
      }

      // Close database
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      // Remove PID file
      await this.removePidFile();

      this.state.status = 'stopped';
      this.state.pid = null;
      this.state.startedAt = null;
      this.emit('status', this.state.status);
      this.emit('stopped');

      this.log('info', 'AIOS Daemon stopped');
    } catch (error) {
      this.state.status = 'error';
      this.state.errors.push((error as Error).message);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Check if daemon is running (via PID file)
   */
  async isAlreadyRunning(): Promise<boolean> {
    try {
      if (!fs.existsSync(this.config.pidFile)) {
        return false;
      }

      const pid = parseInt(fs.readFileSync(this.config.pidFile, 'utf-8').trim(), 10);

      // Check if process is actually running
      try {
        process.kill(pid, 0);
        return true; // Process exists
      } catch {
        // Process doesn't exist, clean up stale PID file
        fs.unlinkSync(this.config.pidFile);
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Get running daemon PID
   */
  getRunningPid(): number | null {
    try {
      if (!fs.existsSync(this.config.pidFile)) {
        return null;
      }
      return parseInt(fs.readFileSync(this.config.pidFile, 'utf-8').trim(), 10);
    } catch {
      return null;
    }
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      path.dirname(this.config.dbPath),
      path.dirname(this.config.pidFile),
      this.config.pluginDir,
      this.config.studioPath,
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private async writePidFile(): Promise<void> {
    fs.writeFileSync(this.config.pidFile, String(process.pid));
  }

  private async removePidFile(): Promise<void> {
    try {
      if (fs.existsSync(this.config.pidFile)) {
        fs.unlinkSync(this.config.pidFile);
      }
    } catch {
      // Ignore errors
    }
  }

  private async initDatabase(): Promise<void> {
    // SQLite initialization will be added by the state module
    this.log('debug', `Database path: ${this.config.dbPath}`);
  }

  private async loadPlugins(): Promise<void> {
    // Plugin loading will be added by the plugins module
    this.log('debug', `Plugin directory: ${this.config.pluginDir}`);
  }

  private async startHttpServer(): Promise<void> {
    // HTTP server will be added by the http module
    // For now, create a basic server that responds to health checks
    this.httpServer = net.createServer((socket) => {
      socket.on('data', (data) => {
        const request = data.toString();

        // Basic HTTP response for health check
        if (request.includes('GET /health') || request.includes('GET /status')) {
          const body = JSON.stringify({
            status: this.state.status,
            uptime: this.state.startedAt
              ? Math.floor((Date.now() - this.state.startedAt.getTime()) / 1000)
              : 0,
            pid: this.state.pid,
            connections: this.state.connections,
            plugins: this.state.plugins,
          });

          const response = [
            'HTTP/1.1 200 OK',
            'Content-Type: application/json',
            `Content-Length: ${body.length}`,
            'Connection: close',
            '',
            body,
          ].join('\r\n');

          socket.write(response);
          socket.end();
        } else {
          // 404 for other routes
          const body = JSON.stringify({ error: 'Not found' });
          const response = [
            'HTTP/1.1 404 Not Found',
            'Content-Type: application/json',
            `Content-Length: ${body.length}`,
            'Connection: close',
            '',
            body,
          ].join('\r\n');

          socket.write(response);
          socket.end();
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      this.httpServer!.listen(this.config.port, this.config.host, () => {
        resolve();
      });
      this.httpServer!.on('error', reject);
    });

    this.httpServer.on('connection', () => {
      this.state.connections.http++;
    });
  }

  private async startWatcher(): Promise<void> {
    // Watcher will use the existing artifact-flow module
    this.log('debug', `Watch paths: ${this.config.watchPaths.join(', ') || 'none configured'}`);
  }

  private log(level: string, message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);

    if (messageLevel >= configLevel) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

      if (level === 'error') {
        console.error(`${prefix} ${message}`);
      } else {
        console.log(`${prefix} ${message}`);
      }

      this.emit('log', { level, message, timestamp });
    }
  }
}

// =============================================================================
// DAEMON CONTROL FUNCTIONS
// =============================================================================

/**
 * Start daemon in foreground (for development)
 */
export async function startForeground(config: Partial<DaemonConfig> = {}): Promise<AIOSDaemon> {
  const daemon = new AIOSDaemon(config);
  await daemon.start();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await daemon.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await daemon.stop();
    process.exit(0);
  });

  return daemon;
}

/**
 * Start daemon in background (daemonized)
 */
export async function startBackground(config: Partial<DaemonConfig> = {}): Promise<number> {
  const { spawn } = await import('child_process');

  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Check if already running
  const daemon = new AIOSDaemon(fullConfig);
  if (await daemon.isAlreadyRunning()) {
    const pid = daemon.getRunningPid();
    throw new Error(`Daemon already running with PID ${pid}`);
  }

  // Spawn detached process
  const child = spawn(process.execPath, [
    path.join(__dirname, 'daemon-runner.js'),
    JSON.stringify(fullConfig),
  ], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, AIOS_DAEMON: 'true' },
  });

  child.unref();

  // Wait for PID file to appear
  const maxWait = 5000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    if (fs.existsSync(fullConfig.pidFile)) {
      const pid = parseInt(fs.readFileSync(fullConfig.pidFile, 'utf-8').trim(), 10);
      return pid;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error('Daemon failed to start (timeout waiting for PID file)');
}

/**
 * Stop running daemon
 */
export async function stopDaemon(config: Partial<DaemonConfig> = {}): Promise<void> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  if (!fs.existsSync(fullConfig.pidFile)) {
    throw new Error('Daemon is not running (no PID file)');
  }

  const pid = parseInt(fs.readFileSync(fullConfig.pidFile, 'utf-8').trim(), 10);

  try {
    // Send SIGTERM for graceful shutdown
    process.kill(pid, 'SIGTERM');

    // Wait for process to exit
    const maxWait = 10000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      try {
        process.kill(pid, 0);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch {
        // Process exited
        return;
      }
    }

    // Force kill if still running
    process.kill(pid, 'SIGKILL');
  } catch (error) {
    // Process doesn't exist, clean up PID file
    if (fs.existsSync(fullConfig.pidFile)) {
      fs.unlinkSync(fullConfig.pidFile);
    }
  }
}

/**
 * Get daemon status
 */
export async function getDaemonStatus(config: Partial<DaemonConfig> = {}): Promise<{
  running: boolean;
  pid: number | null;
  uptime: number | null;
  port: number;
}> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const daemon = new AIOSDaemon(fullConfig);
  const running = await daemon.isAlreadyRunning();
  const pid = daemon.getRunningPid();

  return {
    running,
    pid,
    uptime: null, // Would need to query the running daemon
    port: fullConfig.port,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default AIOSDaemon;
