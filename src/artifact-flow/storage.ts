/**
 * Arcanea Artifact Flow - Storage
 *
 * Manages artifact storage, indexing, and retrieval.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  Artifact,
  ArtifactCategory,
  ClassificationResult,
  FlowConfig,
  SearchOptions,
  SearchResult,
} from './types';

/**
 * Default flow configuration
 */
const DEFAULT_CONFIG: FlowConfig = {
  version: '1.0.0',
  studioPath: '',
  watchPaths: [],
  ignoredPatterns: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/.turbo/**',
    '**/.next/**',
  ],
  autoClassify: true,
  autoStore: false,
  debounceMs: 500,
  stabilityThreshold: 2000,
};

/**
 * Category to subdirectory mapping
 */
const CATEGORY_PATHS: Record<ArtifactCategory, string> = {
  lore: 'artifacts/lore',
  character: 'artifacts/characters',
  location: 'artifacts/locations',
  creature: 'artifacts/creatures',
  artifact: 'artifacts/magical-items',
  prompt: 'artifacts/prompts',
  agent: 'artifacts/agents',
  code: 'artifacts/code',
  image: 'artifacts/images',
  document: 'artifacts/documents',
  config: 'artifacts/config',
  unknown: 'inbox',
};

/**
 * Artifact Storage Manager
 *
 * Handles storing, indexing, and retrieving artifacts.
 */
export class ArtifactStorage {
  private config: FlowConfig;
  private indexPath: string;
  private artifacts: Map<string, Artifact> = new Map();

  constructor(studioPath: string, config?: Partial<FlowConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      studioPath,
    };
    this.indexPath = path.join(studioPath, 'index', 'artifacts.json');
  }

  /**
   * Initialize the storage system
   */
  async initialize(): Promise<void> {
    // Create directory structure
    await this.createDirectories();

    // Load existing index
    await this.loadIndex();

    // Save config
    await this.saveConfig();
  }

  /**
   * Create the studio directory structure
   */
  private async createDirectories(): Promise<void> {
    const dirs = [
      'artifacts/lore/canon',
      'artifacts/lore/extended',
      'artifacts/lore/drafts',
      'artifacts/characters/guardians',
      'artifacts/characters/awakened',
      'artifacts/characters/luminors',
      'artifacts/characters/player-created',
      'artifacts/locations/realms',
      'artifacts/locations/academies',
      'artifacts/locations/sanctuaries',
      'artifacts/creatures/godbeasts',
      'artifacts/creatures/bestiary',
      'artifacts/magical-items/legendary',
      'artifacts/magical-items/common',
      'artifacts/prompts/system',
      'artifacts/prompts/creative',
      'artifacts/prompts/arc',
      'artifacts/agents/guardians',
      'artifacts/agents/awakened',
      'artifacts/agents/custom',
      'artifacts/code/components',
      'artifacts/code/tools',
      'artifacts/code/mcp',
      'artifacts/images/characters',
      'artifacts/images/locations',
      'artifacts/images/ui',
      'artifacts/images/generated',
      'artifacts/documents/designs',
      'artifacts/documents/guides',
      'artifacts/documents/notes',
      'artifacts/config',
      'index',
      'inbox',
      'archive',
    ];

    for (const dir of dirs) {
      const fullPath = path.join(this.config.studioPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  }

  /**
   * Load the artifact index from disk
   */
  private async loadIndex(): Promise<void> {
    try {
      if (fs.existsSync(this.indexPath)) {
        const data = fs.readFileSync(this.indexPath, 'utf-8');
        const artifacts = JSON.parse(data) as Artifact[];
        this.artifacts.clear();
        for (const artifact of artifacts) {
          this.artifacts.set(artifact.id, {
            ...artifact,
            createdAt: new Date(artifact.createdAt),
            updatedAt: new Date(artifact.updatedAt),
          });
        }
      }
    } catch (error) {
      console.error('Failed to load artifact index:', error);
      this.artifacts.clear();
    }
  }

  /**
   * Save the artifact index to disk
   */
  private async saveIndex(): Promise<void> {
    const artifacts = Array.from(this.artifacts.values());
    const indexDir = path.dirname(this.indexPath);
    if (!fs.existsSync(indexDir)) {
      fs.mkdirSync(indexDir, { recursive: true });
    }
    fs.writeFileSync(this.indexPath, JSON.stringify(artifacts, null, 2));
  }

  /**
   * Save the flow configuration
   */
  private async saveConfig(): Promise<void> {
    const configPath = path.join(this.config.studioPath, '.flow-config.json');
    fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
  }

  /**
   * Generate a unique artifact ID
   */
  private generateId(): string {
    return `art_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Calculate checksum for content
   */
  private calculateChecksum(content: string | Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    return hash.digest('hex').slice(0, 16);
  }

  /**
   * Determine storage path for an artifact
   */
  private getStoragePath(
    fileName: string,
    classification: ClassificationResult
  ): string {
    let basePath = CATEGORY_PATHS[classification.category] || 'inbox';

    // Add subcategory if present
    if (classification.subcategory) {
      basePath = path.join(basePath, classification.subcategory);
    }

    // Add guardian-specific path for agents
    if (classification.category === 'agent' && classification.guardian) {
      basePath = path.join('artifacts/agents', 'guardians');
    }

    // Add element-based organization for lore
    if (classification.category === 'lore' && classification.element) {
      basePath = path.join(basePath, classification.element);
    }

    return path.join(basePath, fileName);
  }

  /**
   * Store an artifact
   */
  async store(
    content: string | Buffer,
    fileName: string,
    classification: ClassificationResult,
    options?: {
      sourcePath?: string;
      sourceWorkspace?: string;
      overwrite?: boolean;
    }
  ): Promise<Artifact> {
    const id = this.generateId();
    const checksum = this.calculateChecksum(content);

    // Check for duplicates by checksum
    const existing = Array.from(this.artifacts.values()).find(
      a => a.checksum === checksum
    );
    if (existing && !options?.overwrite) {
      return existing;
    }

    const relativePath = this.getStoragePath(fileName, classification);
    const fullPath = path.join(this.config.studioPath, relativePath);

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(fullPath, content);

    // Create artifact record
    const artifact: Artifact = {
      id,
      fileName,
      originalPath: options?.sourcePath,
      storagePath: relativePath,
      category: classification.category,
      subcategory: classification.subcategory,
      element: classification.element,
      gate: classification.gate,
      guardian: classification.guardian,
      tags: classification.tags,
      metadata: classification.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      sourceWorkspace: options?.sourceWorkspace,
      checksum,
    };

    // Add to index
    this.artifacts.set(id, artifact);
    await this.saveIndex();

    return artifact;
  }

  /**
   * Get an artifact by ID
   */
  async get(id: string): Promise<Artifact | null> {
    return this.artifacts.get(id) || null;
  }

  /**
   * Get artifact content by ID
   */
  async getContent(id: string): Promise<string | Buffer | null> {
    const artifact = this.artifacts.get(id);
    if (!artifact) return null;

    const fullPath = path.join(this.config.studioPath, artifact.storagePath);
    if (!fs.existsSync(fullPath)) return null;

    // Return as buffer for images, string for text
    if (artifact.category === 'image') {
      return fs.readFileSync(fullPath);
    }
    return fs.readFileSync(fullPath, 'utf-8');
  }

  /**
   * List artifacts by category
   */
  async list(category?: ArtifactCategory): Promise<Artifact[]> {
    const artifacts = Array.from(this.artifacts.values());
    if (category) {
      return artifacts.filter(a => a.category === category);
    }
    return artifacts;
  }

  /**
   * Search artifacts
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const query = options.query.toLowerCase();

    for (const artifact of this.artifacts.values()) {
      // Filter by category
      if (options.category && artifact.category !== options.category) continue;

      // Filter by element
      if (options.element && artifact.element !== options.element) continue;

      // Filter by gate
      if (options.gate && artifact.gate !== options.gate) continue;

      // Filter by tags
      if (options.tags && options.tags.length > 0) {
        const hasAllTags = options.tags.every(t => artifact.tags.includes(t));
        if (!hasAllTags) continue;
      }

      // Score based on query match
      let score = 0;
      const searchableText = [
        artifact.fileName,
        artifact.category,
        artifact.subcategory,
        artifact.guardian,
        ...artifact.tags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (searchableText.includes(query)) {
        score = 0.8;
        if (artifact.fileName.toLowerCase().includes(query)) {
          score = 1.0;
        }
      } else if (query.split(' ').some(word => searchableText.includes(word))) {
        score = 0.5;
      }

      if (score > 0) {
        results.push({ artifact, score });
      }
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    return results.slice(offset, offset + limit);
  }

  /**
   * Delete an artifact
   */
  async delete(id: string): Promise<boolean> {
    const artifact = this.artifacts.get(id);
    if (!artifact) return false;

    // Move to archive instead of deleting
    const archivePath = path.join(
      this.config.studioPath,
      'archive',
      `${id}_${artifact.fileName}`
    );
    const sourcePath = path.join(this.config.studioPath, artifact.storagePath);

    if (fs.existsSync(sourcePath)) {
      fs.renameSync(sourcePath, archivePath);
    }

    this.artifacts.delete(id);
    await this.saveIndex();

    return true;
  }

  /**
   * Update artifact metadata
   */
  async update(
    id: string,
    updates: Partial<Pick<Artifact, 'tags' | 'metadata' | 'category' | 'subcategory'>>
  ): Promise<Artifact | null> {
    const artifact = this.artifacts.get(id);
    if (!artifact) return null;

    const updated: Artifact = {
      ...artifact,
      ...updates,
      updatedAt: new Date(),
    };

    this.artifacts.set(id, updated);
    await this.saveIndex();

    return updated;
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalArtifacts: number;
    byCategory: Record<string, number>;
    byElement: Record<string, number>;
    recentlyAdded: Artifact[];
  }> {
    const artifacts = Array.from(this.artifacts.values());

    const byCategory: Record<string, number> = {};
    const byElement: Record<string, number> = {};

    for (const artifact of artifacts) {
      byCategory[artifact.category] = (byCategory[artifact.category] || 0) + 1;
      if (artifact.element) {
        byElement[artifact.element] = (byElement[artifact.element] || 0) + 1;
      }
    }

    const recentlyAdded = artifacts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      totalArtifacts: artifacts.length,
      byCategory,
      byElement,
      recentlyAdded,
    };
  }

  /**
   * Get the flow configuration
   */
  getConfig(): FlowConfig {
    return { ...this.config };
  }
}

/**
 * Create a new storage instance
 */
export function createStorage(studioPath: string, config?: Partial<FlowConfig>): ArtifactStorage {
  return new ArtifactStorage(studioPath, config);
}
