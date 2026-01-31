/**
 * AIOS State Management - SQLite Persistence Layer
 *
 * Manages local state persistence including:
 * - Journey progression (Gate unlocking)
 * - Drafts and artifacts
 * - User settings
 * - Plugin state
 * - Sync state
 */

import * as fs from 'fs';
import * as path from 'path';
import type { GateName } from '../index';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface JourneyState {
  id: string;
  userId: string;
  gatesUnlocked: GateName[];
  currentGate: GateName;
  activeGuardian: string | null;
  experience: number;
  achievements: string[];
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Draft {
  id: string;
  title: string;
  content: string;
  type: 'story' | 'character' | 'world' | 'artifact' | 'lore' | 'other';
  gate: GateName | null;
  guardian: string | null;
  tags: string[];
  status: 'draft' | 'review' | 'published' | 'archived';
  localPath: string | null;
  cloudId: string | null;
  syncState: 'local' | 'synced' | 'conflict';
  createdAt: Date;
  updatedAt: Date;
}

export interface PluginState {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  config: Record<string, unknown>;
  installedAt: Date;
  lastUsed: Date | null;
}

export interface SyncState {
  id: string;
  entityType: 'draft' | 'artifact' | 'journey' | 'settings';
  entityId: string;
  localVersion: number;
  cloudVersion: number;
  lastSyncAt: Date | null;
  status: 'synced' | 'pending' | 'conflict';
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'arcanea';
  defaultGuardian: string | null;
  defaultGate: GateName;
  autoSync: boolean;
  syncInterval: number; // minutes
  watchPaths: string[];
  notifications: boolean;
}

// =============================================================================
// STATE STORE CLASS (In-Memory with File Persistence)
// =============================================================================

/**
 * Simple file-based state store (SQLite will be added with better-sqlite3)
 * For now, uses JSON files for persistence
 */
export class StateStore {
  private basePath: string;
  private journey: JourneyState | null = null;
  private drafts: Map<string, Draft> = new Map();
  private plugins: Map<string, PluginState> = new Map();
  private settings: UserSettings;
  private syncStates: Map<string, SyncState> = new Map();
  private initialized = false;

  constructor(basePath?: string) {
    this.basePath = basePath || path.join(
      process.env.HOME || process.env.USERPROFILE || '',
      '.arcanea'
    );
    this.settings = this.getDefaultSettings();
  }

  /**
   * Initialize the state store
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }

    // Load existing state
    await this.loadState();
    this.initialized = true;
  }

  /**
   * Close the state store
   */
  close(): void {
    this.saveState();
    this.initialized = false;
  }

  // =============================================================================
  // JOURNEY METHODS
  // =============================================================================

  getJourney(): JourneyState | null {
    return this.journey;
  }

  async createJourney(userId: string = 'local'): Promise<JourneyState> {
    const now = new Date();
    this.journey = {
      id: this.generateId(),
      userId,
      gatesUnlocked: ['foundation'],
      currentGate: 'foundation',
      activeGuardian: null,
      experience: 0,
      achievements: ['journey_begun'],
      lastActivity: now,
      createdAt: now,
      updatedAt: now,
    };
    await this.saveState();
    return this.journey;
  }

  async updateJourney(updates: Partial<JourneyState>): Promise<JourneyState | null> {
    if (!this.journey) return null;

    this.journey = {
      ...this.journey,
      ...updates,
      updatedAt: new Date(),
      lastActivity: new Date(),
    };
    await this.saveState();
    return this.journey;
  }

  async unlockGate(gate: GateName): Promise<boolean> {
    if (!this.journey) return false;
    if (this.journey.gatesUnlocked.includes(gate)) return true;

    this.journey.gatesUnlocked.push(gate);
    this.journey.currentGate = gate;
    this.journey.updatedAt = new Date();
    this.journey.lastActivity = new Date();

    await this.saveState();
    return true;
  }

  // =============================================================================
  // DRAFT METHODS
  // =============================================================================

  getDraft(id: string): Draft | undefined {
    return this.drafts.get(id);
  }

  getAllDrafts(): Draft[] {
    return Array.from(this.drafts.values());
  }

  getDraftsByStatus(status: Draft['status']): Draft[] {
    return this.getAllDrafts().filter(d => d.status === status);
  }

  getDraftsByGate(gate: GateName): Draft[] {
    return this.getAllDrafts().filter(d => d.gate === gate);
  }

  async createDraft(draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt' | 'syncState'>): Promise<Draft> {
    const now = new Date();
    const newDraft: Draft = {
      ...draft,
      id: this.generateId(),
      syncState: 'local',
      createdAt: now,
      updatedAt: now,
    };
    this.drafts.set(newDraft.id, newDraft);
    await this.saveState();
    return newDraft;
  }

  async updateDraft(id: string, updates: Partial<Draft>): Promise<Draft | null> {
    const draft = this.drafts.get(id);
    if (!draft) return null;

    const updatedDraft: Draft = {
      ...draft,
      ...updates,
      updatedAt: new Date(),
      syncState: 'local', // Mark as needing sync
    };
    this.drafts.set(id, updatedDraft);
    await this.saveState();
    return updatedDraft;
  }

  async deleteDraft(id: string): Promise<boolean> {
    const deleted = this.drafts.delete(id);
    if (deleted) {
      await this.saveState();
    }
    return deleted;
  }

  // =============================================================================
  // PLUGIN METHODS
  // =============================================================================

  getPlugin(id: string): PluginState | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): PluginState[] {
    return Array.from(this.plugins.values());
  }

  getEnabledPlugins(): PluginState[] {
    return this.getAllPlugins().filter(p => p.enabled);
  }

  async registerPlugin(plugin: Omit<PluginState, 'installedAt' | 'lastUsed'>): Promise<PluginState> {
    const newPlugin: PluginState = {
      ...plugin,
      installedAt: new Date(),
      lastUsed: null,
    };
    this.plugins.set(plugin.id, newPlugin);
    await this.saveState();
    return newPlugin;
  }

  async updatePlugin(id: string, updates: Partial<PluginState>): Promise<PluginState | null> {
    const plugin = this.plugins.get(id);
    if (!plugin) return null;

    const updatedPlugin: PluginState = {
      ...plugin,
      ...updates,
    };
    this.plugins.set(id, updatedPlugin);
    await this.saveState();
    return updatedPlugin;
  }

  async removePlugin(id: string): Promise<boolean> {
    const deleted = this.plugins.delete(id);
    if (deleted) {
      await this.saveState();
    }
    return deleted;
  }

  // =============================================================================
  // SETTINGS METHODS
  // =============================================================================

  getSettings(): UserSettings {
    return { ...this.settings };
  }

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    this.settings = {
      ...this.settings,
      ...updates,
    };
    await this.saveState();
    return this.settings;
  }

  // =============================================================================
  // SYNC STATE METHODS
  // =============================================================================

  getSyncState(entityType: string, entityId: string): SyncState | undefined {
    const key = `${entityType}:${entityId}`;
    return this.syncStates.get(key);
  }

  getPendingSyncs(): SyncState[] {
    return Array.from(this.syncStates.values()).filter(s => s.status === 'pending');
  }

  getConflicts(): SyncState[] {
    return Array.from(this.syncStates.values()).filter(s => s.status === 'conflict');
  }

  async updateSyncState(
    entityType: SyncState['entityType'],
    entityId: string,
    updates: Partial<SyncState>
  ): Promise<SyncState> {
    const key = `${entityType}:${entityId}`;
    const existing = this.syncStates.get(key);

    const syncState: SyncState = {
      id: key,
      entityType,
      entityId,
      localVersion: existing?.localVersion || 1,
      cloudVersion: existing?.cloudVersion || 0,
      lastSyncAt: existing?.lastSyncAt || null,
      status: existing?.status || 'pending',
      ...updates,
    };

    this.syncStates.set(key, syncState);
    await this.saveState();
    return syncState;
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private getDefaultSettings(): UserSettings {
    return {
      theme: 'arcanea',
      defaultGuardian: null,
      defaultGate: 'foundation',
      autoSync: false,
      syncInterval: 5,
      watchPaths: [],
      notifications: true,
    };
  }

  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadState(): Promise<void> {
    const statePath = path.join(this.basePath, 'state.json');

    if (!fs.existsSync(statePath)) {
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(statePath, 'utf-8'));

      if (data.journey) {
        this.journey = {
          ...data.journey,
          lastActivity: new Date(data.journey.lastActivity),
          createdAt: new Date(data.journey.createdAt),
          updatedAt: new Date(data.journey.updatedAt),
        };
      }

      if (data.drafts) {
        this.drafts = new Map(
          Object.entries(data.drafts).map(([id, draft]: [string, any]) => [
            id,
            {
              ...draft,
              createdAt: new Date(draft.createdAt),
              updatedAt: new Date(draft.updatedAt),
            },
          ])
        );
      }

      if (data.plugins) {
        this.plugins = new Map(
          Object.entries(data.plugins).map(([id, plugin]: [string, any]) => [
            id,
            {
              ...plugin,
              installedAt: new Date(plugin.installedAt),
              lastUsed: plugin.lastUsed ? new Date(plugin.lastUsed) : null,
            },
          ])
        );
      }

      if (data.settings) {
        this.settings = { ...this.getDefaultSettings(), ...data.settings };
      }

      if (data.syncStates) {
        this.syncStates = new Map(
          Object.entries(data.syncStates).map(([id, state]: [string, any]) => [
            id,
            {
              ...state,
              lastSyncAt: state.lastSyncAt ? new Date(state.lastSyncAt) : null,
            },
          ])
        );
      }
    } catch (error) {
      console.error('Error loading state:', (error as Error).message);
    }
  }

  private async saveState(): Promise<void> {
    const statePath = path.join(this.basePath, 'state.json');

    const data = {
      journey: this.journey,
      drafts: Object.fromEntries(this.drafts),
      plugins: Object.fromEntries(this.plugins),
      settings: this.settings,
      syncStates: Object.fromEntries(this.syncStates),
      savedAt: new Date().toISOString(),
    };

    fs.writeFileSync(statePath, JSON.stringify(data, null, 2));
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export function createStateStore(basePath?: string): StateStore {
  return new StateStore(basePath);
}

export default StateStore;
