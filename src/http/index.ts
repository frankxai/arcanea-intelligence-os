/**
 * AIOS HTTP API Server
 *
 * RESTful HTTP API for daemon management and integration:
 * - /status - Daemon status
 * - /tools - List MCP tools
 * - /tools/:name - Call a tool
 * - /plugins - Plugin management
 * - /journey - Journey state
 * - /drafts - Draft management
 * - /sync - Cloud sync operations
 * - /ws - WebSocket for real-time updates
 */

import * as http from 'http';
import * as url from 'url';
import * as path from 'path';
import { EventEmitter } from 'events';
import type { StateStore } from '../state';
import type { PluginRegistry } from '../plugins';
import type { DaemonState } from '../daemon';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface HttpServerConfig {
  port: number;
  host: string;
  corsOrigins?: string[];
  authToken?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

interface Route {
  method: HttpMethod;
  pattern: RegExp;
  handler: (req: http.IncomingMessage, params: Record<string, string>) => Promise<ApiResponse>;
}

// =============================================================================
// HTTP SERVER CLASS
// =============================================================================

export class HttpApiServer extends EventEmitter {
  private config: HttpServerConfig;
  private server: http.Server | null = null;
  private routes: Route[] = [];
  private stateStore: StateStore | null = null;
  private pluginRegistry: PluginRegistry | null = null;
  private getDaemonState: (() => DaemonState) | null = null;
  private agentDbPath: string;

  constructor(config: Partial<HttpServerConfig> = {}) {
    super();
    this.config = {
      port: config.port || 3333,
      host: config.host || '127.0.0.1',
      corsOrigins: config.corsOrigins || ['http://localhost:3000'],
      authToken: config.authToken,
    };
    this.agentDbPath = path.join(
      process.env.ARCANEA_DB || path.join(process.env.HOME || process.env.USERPROFILE || '', '.arcanea', 'agentdb.sqlite3')
    );

    this.setupRoutes();
  }

  /**
   * Connect state store
   */
  connectStateStore(store: StateStore): void {
    this.stateStore = store;
  }

  /**
   * Connect plugin registry
   */
  connectPluginRegistry(registry: PluginRegistry): void {
    this.pluginRegistry = registry;
  }

  /**
   * Connect daemon state getter
   */
  connectDaemonState(getter: () => DaemonState): void {
    this.getDaemonState = getter;
  }

  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));

      this.server.on('error', reject);

      this.server.listen(this.config.port, this.config.host, () => {
        this.emit('started', { port: this.config.port, host: this.config.host });
        resolve();
      });
    });
  }

  /**
   * Stop the HTTP server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          this.emit('stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // =============================================================================
  // ROUTE SETUP
  // =============================================================================

  private setupRoutes(): void {
    // Status & Health
    this.addRoute('GET', '/health', async () => ({ success: true, data: { status: 'healthy' } }));
    this.addRoute('GET', '/status', async () => this.handleStatus());

    // Tools
    this.addRoute('GET', '/tools', async () => this.handleListTools());
    this.addRoute('POST', '/tools/:name', async (req, params) => this.handleCallTool(req, params.name));

    // Resources
    this.addRoute('GET', '/resources', async () => this.handleListResources());
    this.addRoute('GET', '/resources/:uri', async (req, params) => this.handleReadResource(params.uri));

    // Plugins
    this.addRoute('GET', '/plugins', async () => this.handleListPlugins());
    this.addRoute('POST', '/plugins/:name/activate', async (req, params) => this.handleActivatePlugin(params.name));
    this.addRoute('POST', '/plugins/:name/deactivate', async (req, params) => this.handleDeactivatePlugin(params.name));
    this.addRoute('DELETE', '/plugins/:name', async (req, params) => this.handleUninstallPlugin(params.name));

    // Journey
    this.addRoute('GET', '/journey', async () => this.handleGetJourney());
    this.addRoute('POST', '/journey', async () => this.handleCreateJourney());
    this.addRoute('PATCH', '/journey', async (req) => this.handleUpdateJourney(req));
    this.addRoute('POST', '/journey/gates/:gate/unlock', async (req, params) => this.handleUnlockGate(params.gate));

    // Drafts
    this.addRoute('GET', '/drafts', async () => this.handleListDrafts());
    this.addRoute('GET', '/drafts/:id', async (req, params) => this.handleGetDraft(params.id));
    this.addRoute('POST', '/drafts', async (req) => this.handleCreateDraft(req));
    this.addRoute('PATCH', '/drafts/:id', async (req, params) => this.handleUpdateDraft(req, params.id));
    this.addRoute('DELETE', '/drafts/:id', async (req, params) => this.handleDeleteDraft(params.id));

    // Settings
    this.addRoute('GET', '/settings', async () => this.handleGetSettings());
    this.addRoute('PATCH', '/settings', async (req) => this.handleUpdateSettings(req));

    // Sync
    this.addRoute('GET', '/sync/status', async () => this.handleSyncStatus());
    this.addRoute('POST', '/sync/push', async () => this.handleSyncPush());
    this.addRoute('POST', '/sync/pull', async () => this.handleSyncPull());

    // AgentDB (read-only bridge to Claude Code hook data)
    this.addRoute('GET', '/agentdb/guardians', async () => this.handleAgentDbQuery('SELECT * FROM agents ORDER BY guardian'));
    this.addRoute('GET', '/agentdb/routing', async () => this.handleAgentDbQuery('SELECT * FROM routing_log ORDER BY timestamp DESC LIMIT 50'));
    this.addRoute('GET', '/agentdb/memories', async () => this.handleAgentDbQuery('SELECT * FROM memories ORDER BY created_at DESC LIMIT 50'));
    this.addRoute('GET', '/agentdb/vault', async () => this.handleAgentDbQuery('SELECT * FROM vault_entries ORDER BY created_at DESC LIMIT 20'));
    this.addRoute('GET', '/agentdb/stats', async () => this.handleAgentDbStats());
  }

  private addRoute(
    method: HttpMethod,
    path: string,
    handler: (req: http.IncomingMessage, params: Record<string, string>) => Promise<ApiResponse>
  ): void {
    // Convert path pattern to regex
    const pattern = new RegExp(
      '^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'
    );
    this.routes.push({ method, pattern, handler });
  }

  // =============================================================================
  // REQUEST HANDLING
  // =============================================================================

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', this.config.corsOrigins?.join(', ') || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Parse URL
    const parsedUrl = url.parse(req.url || '/', true);
    const pathname = parsedUrl.pathname || '/';

    // Auth check (if configured)
    if (this.config.authToken) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${this.config.authToken}`) {
        this.sendResponse(res, 401, { success: false, error: 'Unauthorized' });
        return;
      }
    }

    // Find matching route
    for (const route of this.routes) {
      if (req.method !== route.method) continue;

      const match = pathname.match(route.pattern);
      if (match) {
        try {
          const params = match.groups || {};
          const response = await route.handler(req, params);
          this.sendResponse(res, response.success ? 200 : 400, response);
        } catch (error) {
          this.sendResponse(res, 500, {
            success: false,
            error: (error as Error).message,
          });
        }
        return;
      }
    }

    // 404 Not Found
    this.sendResponse(res, 404, { success: false, error: 'Not found' });
  }

  private sendResponse(res: http.ServerResponse, status: number, data: ApiResponse): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private async readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          reject(new Error('Invalid JSON body'));
        }
      });
      req.on('error', reject);
    });
  }

  // =============================================================================
  // ROUTE HANDLERS
  // =============================================================================

  private async handleStatus(): Promise<ApiResponse> {
    if (!this.getDaemonState) {
      return { success: false, error: 'Daemon state not connected' };
    }

    const state = this.getDaemonState();
    return {
      success: true,
      data: {
        status: state.status,
        pid: state.pid,
        startedAt: state.startedAt,
        uptime: state.startedAt
          ? Math.floor((Date.now() - state.startedAt.getTime()) / 1000)
          : 0,
        connections: state.connections,
        plugins: state.plugins,
      },
    };
  }

  private async handleListTools(): Promise<ApiResponse> {
    // Return built-in tools + plugin tools
    const builtInTools = [
      { name: 'channel_guardian', description: 'Channel a Guardian for guidance', plugin: 'core' },
      { name: 'invoke_awakened', description: 'Invoke an Awakened consciousness', plugin: 'core' },
      { name: 'list_guardians', description: 'List all Guardians', plugin: 'core' },
      // ... more built-in tools
    ];

    const pluginTools = this.pluginRegistry?.getTools() || [];

    return {
      success: true,
      data: {
        tools: [...builtInTools, ...pluginTools],
        count: builtInTools.length + pluginTools.length,
      },
    };
  }

  private async handleCallTool(req: http.IncomingMessage, name: string): Promise<ApiResponse> {
    const body = await this.readBody(req);

    // Check if it's a plugin tool
    if (name.includes(':') && this.pluginRegistry) {
      try {
        const result = await this.pluginRegistry.callTool(name, body);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }

    // Built-in tool handling would go here
    return { success: false, error: `Tool ${name} not implemented` };
  }

  private async handleListResources(): Promise<ApiResponse> {
    return {
      success: true,
      data: {
        resources: [
          { uri: 'arcanea://guardians', name: 'The Ten Guardians' },
          { uri: 'arcanea://awakened', name: 'The Seven Awakened' },
          { uri: 'arcanea://gates', name: 'The Ten Gates' },
        ],
      },
    };
  }

  private async handleReadResource(uri: string): Promise<ApiResponse> {
    // Decode URI
    const decodedUri = decodeURIComponent(uri);

    // Check plugin resources
    if (this.pluginRegistry) {
      try {
        const result = await this.pluginRegistry.readResource(decodedUri);
        return { success: true, data: result };
      } catch {
        // Not a plugin resource
      }
    }

    return { success: false, error: `Resource ${decodedUri} not found` };
  }

  private async handleListPlugins(): Promise<ApiResponse> {
    if (!this.pluginRegistry) {
      return { success: true, data: { plugins: [] } };
    }

    const plugins = this.pluginRegistry.getPlugins().map(p => ({
      name: p.manifest.name,
      version: p.manifest.version,
      description: p.manifest.description,
      author: p.manifest.author,
      status: p.status,
      gate: p.manifest.gate,
      guardian: p.manifest.guardian,
      tools: p.manifest.tools?.length || 0,
    }));

    return { success: true, data: { plugins } };
  }

  private async handleActivatePlugin(name: string): Promise<ApiResponse> {
    if (!this.pluginRegistry) {
      return { success: false, error: 'Plugin registry not connected' };
    }

    try {
      await this.pluginRegistry.activatePlugin(name);
      return { success: true, data: { message: `Plugin ${name} activated` } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async handleDeactivatePlugin(name: string): Promise<ApiResponse> {
    if (!this.pluginRegistry) {
      return { success: false, error: 'Plugin registry not connected' };
    }

    try {
      await this.pluginRegistry.deactivatePlugin(name);
      return { success: true, data: { message: `Plugin ${name} deactivated` } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async handleUninstallPlugin(name: string): Promise<ApiResponse> {
    if (!this.pluginRegistry) {
      return { success: false, error: 'Plugin registry not connected' };
    }

    try {
      await this.pluginRegistry.uninstallPlugin(name);
      return { success: true, data: { message: `Plugin ${name} uninstalled` } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async handleGetJourney(): Promise<ApiResponse> {
    if (!this.stateStore) {
      return { success: false, error: 'State store not connected' };
    }

    const journey = this.stateStore.getJourney();
    return { success: true, data: { journey } };
  }

  private async handleCreateJourney(): Promise<ApiResponse> {
    if (!this.stateStore) {
      return { success: false, error: 'State store not connected' };
    }

    const journey = await this.stateStore.createJourney();
    return { success: true, data: { journey } };
  }

  private async handleUpdateJourney(req: http.IncomingMessage): Promise<ApiResponse> {
    if (!this.stateStore) {
      return { success: false, error: 'State store not connected' };
    }

    const body = await this.readBody(req);
    const journey = await this.stateStore.updateJourney(body);
    return { success: true, data: { journey } };
  }

  private async handleUnlockGate(gate: string): Promise<ApiResponse> {
    if (!this.stateStore) {
      return { success: false, error: 'State store not connected' };
    }

    const success = await this.stateStore.unlockGate(gate as any);
    const journey = this.stateStore.getJourney();
    return { success, data: { journey } };
  }

  private async handleListDrafts(): Promise<ApiResponse> {
    if (!this.stateStore) {
      return { success: false, error: 'State store not connected' };
    }

    const drafts = this.stateStore.getAllDrafts();
    return { success: true, data: { drafts, count: drafts.length } };
  }

  private async handleGetDraft(id: string): Promise<ApiResponse> {
    if (!this.stateStore) {
      return { success: false, error: 'State store not connected' };
    }

    const draft = this.stateStore.getDraft(id);
    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }
    return { success: true, data: { draft } };
  }

  private async handleCreateDraft(req: http.IncomingMessage): Promise<ApiResponse> {
    if (!this.stateStore) {
      return { success: false, error: 'State store not connected' };
    }

    const body = await this.readBody(req);
    const draft = await this.stateStore.createDraft(body as any);
    return { success: true, data: { draft } };
  }

  private async handleUpdateDraft(req: http.IncomingMessage, id: string): Promise<ApiResponse> {
    if (!this.stateStore) {
      return { success: false, error: 'State store not connected' };
    }

    const body = await this.readBody(req);
    const draft = await this.stateStore.updateDraft(id, body);
    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }
    return { success: true, data: { draft } };
  }

  private async handleDeleteDraft(id: string): Promise<ApiResponse> {
    if (!this.stateStore) {
      return { success: false, error: 'State store not connected' };
    }

    const success = await this.stateStore.deleteDraft(id);
    return { success, data: { deleted: success } };
  }

  private async handleGetSettings(): Promise<ApiResponse> {
    if (!this.stateStore) {
      return { success: false, error: 'State store not connected' };
    }

    const settings = this.stateStore.getSettings();
    return { success: true, data: { settings } };
  }

  private async handleUpdateSettings(req: http.IncomingMessage): Promise<ApiResponse> {
    if (!this.stateStore) {
      return { success: false, error: 'State store not connected' };
    }

    const body = await this.readBody(req);
    const settings = await this.stateStore.updateSettings(body as any);
    return { success: true, data: { settings } };
  }

  private async handleSyncStatus(): Promise<ApiResponse> {
    if (!this.stateStore) {
      return { success: false, error: 'State store not connected' };
    }

    const pending = this.stateStore.getPendingSyncs();
    const conflicts = this.stateStore.getConflicts();

    return {
      success: true,
      data: {
        pendingCount: pending.length,
        conflictCount: conflicts.length,
        pending,
        conflicts,
      },
    };
  }

  private async handleSyncPush(): Promise<ApiResponse> {
    // Cloud sync push would be implemented here
    return {
      success: false,
      error: 'Cloud sync not configured',
    };
  }

  private async handleSyncPull(): Promise<ApiResponse> {
    // Cloud sync pull would be implemented here
    return {
      success: false,
      error: 'Cloud sync not configured',
    };
  }

  // =============================================================================
  // AGENTDB HANDLERS (read-only bridge to Claude Code hook data)
  // =============================================================================

  private runPython(script: string): string {
    const { spawnSync } = require('child_process');
    const result = spawnSync('python3', ['-c', script], {
      encoding: 'utf-8',
      timeout: 5000,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr || 'Python script failed');
    return (result.stdout || '').trim();
  }

  private async handleAgentDbQuery(sql: string): Promise<ApiResponse> {
    try {
      const script = [
        'import sqlite3, json, os',
        `db = "${this.agentDbPath}"`,
        `sql = """${sql}"""`,
        'if not os.path.exists(db): print(json.dumps([])); exit()',
        'c = sqlite3.connect(db); c.row_factory = sqlite3.Row',
        'try:',
        '  rows = [dict(r) for r in c.execute(sql).fetchall()]',
        '  print(json.dumps(rows, default=str))',
        'except Exception as e:',
        '  print(json.dumps([])) if "no such table" in str(e) else (_ for _ in ()).throw(e)',
        'finally: c.close()',
      ].join('\n');
      const rows = JSON.parse(this.runPython(script) || '[]');
      return { success: true, data: { rows, count: rows.length } };
    } catch (error) {
      return { success: false, error: `AgentDB query failed: ${(error as Error).message}` };
    }
  }

  private async handleAgentDbStats(): Promise<ApiResponse> {
    try {
      const script = [
        'import sqlite3, json, os',
        `db = "${this.agentDbPath}"`,
        'if not os.path.exists(db): print(json.dumps({})); exit()',
        'c = sqlite3.connect(db)',
        'tables = {r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type=\'table\'").fetchall()}',
        'stats = {}',
        'for t in ["agents","memories","routing_log","vault_entries","tasks"]:',
        '  if t in tables: stats[f"total_{t}"] = c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]',
        'if "agents" in tables: stats["active_agents"] = c.execute("SELECT COUNT(*) FROM agents WHERE status=\'active\'").fetchone()[0]',
        'print(json.dumps(stats))',
        'c.close()',
      ].join('\n');
      const stats = JSON.parse(this.runPython(script) || '{}');
      return { success: true, data: { stats } };
    } catch (error) {
      return { success: false, error: `AgentDB stats failed: ${(error as Error).message}` };
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export function createHttpServer(config?: Partial<HttpServerConfig>): HttpApiServer {
  return new HttpApiServer(config);
}

export default HttpApiServer;
