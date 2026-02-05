/**
 * AIOS Plugin System
 *
 * Extensible plugin architecture for:
 * - Custom MCP tools
 * - External API integrations
 * - Workflow automation
 * - Visual generation providers
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { GateName, GATES } from '../index';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Plugin manifest schema (plugin.yaml)
 */
export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license?: string;
  homepage?: string;
  repository?: string;

  /** Gate alignment (optional) */
  gate?: GateName;
  /** Guardian affinity (optional) */
  guardian?: string;

  /** MCP tools provided by this plugin */
  tools?: PluginTool[];

  /** Resources provided by this plugin */
  resources?: PluginResource[];

  /** Dependencies on other plugins or packages */
  dependencies?: Record<string, string>;

  /** Required permissions */
  permissions?: PluginPermission[];

  /** Lifecycle hooks */
  hooks?: {
    install?: string;
    activate?: string;
    deactivate?: string;
    uninstall?: string;
  };

  /** Configuration schema */
  config?: {
    schema: Record<string, PluginConfigField>;
    defaults: Record<string, unknown>;
  };
}

export interface PluginTool {
  name: string;
  description: string;
  inputs: PluginToolInput[];
  handler: string; // Path to handler function
}

export interface PluginToolInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  default?: unknown;
  enum?: string[];
}

export interface PluginResource {
  uri: string;
  name: string;
  mimeType: string;
  description?: string;
  handler: string;
}

export type PluginPermission =
  | 'filesystem:read'
  | 'filesystem:write'
  | 'network:outbound'
  | 'network:inbound'
  | 'process:spawn'
  | 'env:read';

export interface PluginConfigField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  default?: unknown;
}

export type PluginStatus = 'installed' | 'active' | 'inactive' | 'error';

type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;
type ResourceHandler = () => Promise<unknown>;

export interface LoadedPlugin {
  manifest: PluginManifest;
  status: PluginStatus;
  path: string;
  config: Record<string, unknown>;
  tools: Map<string, ToolHandler>;
  resources: Map<string, ResourceHandler>;
  error?: string;
}

// =============================================================================
// PLUGIN REGISTRY
// =============================================================================

export class PluginRegistry extends EventEmitter {
  private pluginDir: string;
  private plugins: Map<string, LoadedPlugin> = new Map();
  private toolHandlers: Map<string, ToolHandler> = new Map();
  private resourceHandlers: Map<string, ResourceHandler> = new Map();

  constructor(pluginDir: string) {
    super();
    this.pluginDir = pluginDir;
  }

  /**
   * Initialize the registry and discover plugins
   */
  async initialize(): Promise<void> {
    // Ensure plugin directory exists
    if (!fs.existsSync(this.pluginDir)) {
      fs.mkdirSync(this.pluginDir, { recursive: true });
    }

    // Discover and load plugins
    await this.discoverPlugins();
  }

  /**
   * Discover plugins in the plugin directory
   */
  async discoverPlugins(): Promise<void> {
    const entries = fs.readdirSync(this.pluginDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = path.join(this.pluginDir, entry.name);
        const manifestPath = path.join(pluginPath, 'plugin.json');

        if (fs.existsSync(manifestPath)) {
          try {
            await this.loadPlugin(pluginPath);
          } catch (error) {
            console.error(`Failed to load plugin ${entry.name}:`, (error as Error).message);
          }
        }
      }
    }
  }

  /**
   * Load a plugin from its directory
   */
  async loadPlugin(pluginPath: string): Promise<LoadedPlugin> {
    const manifestPath = path.join(pluginPath, 'plugin.json');

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`No plugin.json found at ${pluginPath}`);
    }

    const manifest: PluginManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Validate manifest
    this.validateManifest(manifest);

    // Create loaded plugin
    const plugin: LoadedPlugin = {
      manifest,
      status: 'installed',
      path: pluginPath,
      config: manifest.config?.defaults || {},
      tools: new Map(),
      resources: new Map(),
    };

    // Load tool handlers
    if (manifest.tools) {
      for (const tool of manifest.tools) {
        try {
          const handlerPath = path.join(pluginPath, tool.handler);
          const handler = await this.loadHandler(handlerPath);
          plugin.tools.set(tool.name, handler);
        } catch (error) {
          console.warn(`Failed to load tool ${tool.name}:`, (error as Error).message);
        }
      }
    }

    // Load resource handlers
    if (manifest.resources) {
      for (const resource of manifest.resources) {
        try {
          const handlerPath = path.join(pluginPath, resource.handler);
          const toolHandler = await this.loadHandler(handlerPath);
          // Wrap tool handler as resource handler (no args)
          const resourceHandler: ResourceHandler = () => toolHandler({});
          plugin.resources.set(resource.uri, resourceHandler);
        } catch (error) {
          console.warn(`Failed to load resource ${resource.uri}:`, (error as Error).message);
        }
      }
    }

    // Register plugin
    this.plugins.set(manifest.name, plugin);
    this.emit('plugin:loaded', { name: manifest.name, plugin });

    return plugin;
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    if (plugin.status === 'active') {
      return;
    }

    // Run activate hook if present
    if (plugin.manifest.hooks?.activate) {
      const hookPath = path.join(plugin.path, plugin.manifest.hooks.activate);
      if (fs.existsSync(hookPath)) {
        try {
          const hook = await this.loadHandler(hookPath);
          await hook({});
        } catch (error) {
          console.warn(`Activate hook failed for ${name}:`, (error as Error).message);
        }
      }
    }

    // Register tools and resources
    for (const [toolName, handler] of plugin.tools) {
      this.toolHandlers.set(`${name}:${toolName}`, handler);
    }

    for (const [uri, handler] of plugin.resources) {
      this.resourceHandlers.set(uri, handler);
    }

    plugin.status = 'active';
    this.emit('plugin:activated', { name, plugin });
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    if (plugin.status !== 'active') {
      return;
    }

    // Run deactivate hook if present
    if (plugin.manifest.hooks?.deactivate) {
      const hookPath = path.join(plugin.path, plugin.manifest.hooks.deactivate);
      if (fs.existsSync(hookPath)) {
        try {
          const hook = await this.loadHandler(hookPath);
          await hook({});
        } catch (error) {
          console.warn(`Deactivate hook failed for ${name}:`, (error as Error).message);
        }
      }
    }

    // Unregister tools and resources
    for (const toolName of plugin.tools.keys()) {
      this.toolHandlers.delete(`${name}:${toolName}`);
    }

    for (const uri of plugin.resources.keys()) {
      this.resourceHandlers.delete(uri);
    }

    plugin.status = 'inactive';
    this.emit('plugin:deactivated', { name, plugin });
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    // Deactivate first
    await this.deactivatePlugin(name);

    // Run uninstall hook if present
    if (plugin.manifest.hooks?.uninstall) {
      const hookPath = path.join(plugin.path, plugin.manifest.hooks.uninstall);
      if (fs.existsSync(hookPath)) {
        try {
          const hook = await this.loadHandler(hookPath);
          await hook({});
        } catch (error) {
          console.warn(`Uninstall hook failed for ${name}:`, (error as Error).message);
        }
      }
    }

    // Remove plugin directory
    fs.rmSync(plugin.path, { recursive: true, force: true });

    // Unregister
    this.plugins.delete(name);
    this.emit('plugin:uninstalled', { name });
  }

  /**
   * Get all loaded plugins
   */
  getPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin
   */
  getPlugin(name: string): LoadedPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all active plugins
   */
  getActivePlugins(): LoadedPlugin[] {
    return this.getPlugins().filter(p => p.status === 'active');
  }

  /**
   * Get all registered tools (including from plugins)
   */
  getTools(): Array<{
    name: string;
    description: string;
    inputs: PluginToolInput[];
    plugin: string;
  }> {
    const tools: Array<{
      name: string;
      description: string;
      inputs: PluginToolInput[];
      plugin: string;
    }> = [];

    for (const [pluginName, plugin] of this.plugins) {
      if (plugin.status !== 'active') continue;
      if (!plugin.manifest.tools) continue;

      for (const tool of plugin.manifest.tools) {
        tools.push({
          name: `${pluginName}:${tool.name}`,
          description: tool.description,
          inputs: tool.inputs,
          plugin: pluginName,
        });
      }
    }

    return tools;
  }

  /**
   * Call a plugin tool
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const handler = this.toolHandlers.get(name);
    if (!handler) {
      throw new Error(`Tool ${name} not found`);
    }

    return handler(args);
  }

  /**
   * Read a plugin resource
   */
  async readResource(uri: string): Promise<unknown> {
    const handler = this.resourceHandlers.get(uri);
    if (!handler) {
      throw new Error(`Resource ${uri} not found`);
    }

    return handler();
  }

  /**
   * Update plugin configuration
   */
  async updatePluginConfig(name: string, config: Record<string, unknown>): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    plugin.config = { ...plugin.config, ...config };
    this.emit('plugin:config-updated', { name, config: plugin.config });
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.name) {
      throw new Error('Plugin manifest must have a name');
    }
    if (!manifest.version) {
      throw new Error('Plugin manifest must have a version');
    }
    if (!manifest.description) {
      throw new Error('Plugin manifest must have a description');
    }
    if (!manifest.author) {
      throw new Error('Plugin manifest must have an author');
    }

    // Validate gate if specified
    if (manifest.gate && !GATES[manifest.gate]) {
      throw new Error(`Invalid gate: ${manifest.gate}`);
    }

    // Validate guardian if specified
    if (manifest.guardian) {
      const validGuardians = Object.values(GATES).map(g => g.guardian.toLowerCase());
      if (!validGuardians.includes(manifest.guardian.toLowerCase())) {
        throw new Error(`Invalid guardian: ${manifest.guardian}`);
      }
    }
  }

  private async loadHandler(handlerPath: string): Promise<ToolHandler> {
    // For security, we use dynamic import in a controlled way
    // In production, this should use VM2 or worker threads for sandboxing

    if (!fs.existsSync(handlerPath)) {
      // Try with .js extension
      handlerPath = handlerPath + '.js';
      if (!fs.existsSync(handlerPath)) {
        throw new Error(`Handler not found: ${handlerPath}`);
      }
    }

    try {
      const module = require(handlerPath);
      return module.default || module.handler || module;
    } catch (error) {
      throw new Error(`Failed to load handler: ${(error as Error).message}`);
    }
  }
}

// =============================================================================
// PLUGIN TEMPLATE GENERATOR
// =============================================================================

export interface PluginTemplateOptions {
  name: string;
  description: string;
  author: string;
  gate?: GateName;
  guardian?: string;
  tools?: Array<{ name: string; description: string }>;
}

export function generatePluginTemplate(options: PluginTemplateOptions): {
  manifest: PluginManifest;
  handler: string;
} {
  const manifest: PluginManifest = {
    name: options.name,
    version: '1.0.0',
    description: options.description,
    author: options.author,
    gate: options.gate,
    guardian: options.guardian,
    tools: options.tools?.map(t => ({
      name: t.name,
      description: t.description,
      inputs: [
        {
          name: 'input',
          type: 'string' as const,
          description: 'Input for the tool',
          required: true,
        },
      ],
      handler: `handlers/${t.name}.js`,
    })),
    permissions: ['network:outbound'],
    hooks: {
      activate: 'hooks/activate.js',
      deactivate: 'hooks/deactivate.js',
    },
    config: {
      schema: {
        apiKey: {
          type: 'string',
          description: 'API key for external service',
          required: false,
        },
      },
      defaults: {},
    },
  };

  const handler = `/**
 * ${options.name} - Tool Handler
 * Generated by AIOS Plugin System
 */

module.exports = async function handler(args) {
  const { input } = args;

  // Your implementation here
  return {
    success: true,
    result: \`Processed: \${input}\`,
  };
};
`;

  return { manifest, handler };
}

/**
 * Create a plugin directory with template files
 */
export async function createPluginFromTemplate(
  pluginDir: string,
  options: PluginTemplateOptions
): Promise<string> {
  const pluginPath = path.join(pluginDir, options.name);

  if (fs.existsSync(pluginPath)) {
    throw new Error(`Plugin directory already exists: ${pluginPath}`);
  }

  // Create directories
  fs.mkdirSync(pluginPath, { recursive: true });
  fs.mkdirSync(path.join(pluginPath, 'handlers'), { recursive: true });
  fs.mkdirSync(path.join(pluginPath, 'hooks'), { recursive: true });

  // Generate template
  const { manifest, handler } = generatePluginTemplate(options);

  // Write manifest
  fs.writeFileSync(
    path.join(pluginPath, 'plugin.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Write handlers
  if (options.tools) {
    for (const tool of options.tools) {
      fs.writeFileSync(
        path.join(pluginPath, 'handlers', `${tool.name}.js`),
        handler.replace(options.name, tool.name)
      );
    }
  }

  // Write hooks
  const activateHook = `module.exports = async function activate() {
  console.log('Plugin ${options.name} activated');
};`;

  const deactivateHook = `module.exports = async function deactivate() {
  console.log('Plugin ${options.name} deactivated');
};`;

  fs.writeFileSync(path.join(pluginPath, 'hooks', 'activate.js'), activateHook);
  fs.writeFileSync(path.join(pluginPath, 'hooks', 'deactivate.js'), deactivateHook);

  return pluginPath;
}

// =============================================================================
// EXPORTS
// =============================================================================

export function createPluginRegistry(pluginDir: string): PluginRegistry {
  return new PluginRegistry(pluginDir);
}

export default PluginRegistry;
