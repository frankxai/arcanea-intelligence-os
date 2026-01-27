/**
 * Arcanea Artifact Flow - File Watcher
 *
 * Watches directories for new/changed files and triggers classification.
 * Uses chokidar for cross-platform file watching.
 */

import * as chokidar from 'chokidar';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { FileEvent, WatcherConfig } from './types';
import { ArtifactClassifier, getClassifier } from './classifier';
import { ArtifactStorage } from './storage';

type FSWatcher = chokidar.FSWatcher;

/**
 * Default watcher configuration
 */
const DEFAULT_CONFIG: WatcherConfig = {
  watchPaths: [],
  ignoredPatterns: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/.turbo/**',
    '**/.next/**',
    '**/coverage/**',
    '**/*.log',
    '**/.DS_Store',
    '**/Thumbs.db',
  ],
  debounceMs: 500,
  stabilityThreshold: 2000,
};

/**
 * Supported file extensions for artifact classification
 */
const SUPPORTED_EXTENSIONS = [
  '.md', '.mdx', '.txt',              // Documents
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', // Images
  '.json', '.yaml', '.yml',           // Data
  '.ts', '.tsx', '.js', '.jsx',       // Code
  '.arc',                             // Arcanean Prompt Language
];

/**
 * Artifact Watcher
 *
 * Watches directories for file changes and emits events.
 * Can be connected to storage for automatic artifact flow.
 */
export class ArtifactWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private config: WatcherConfig;
  private storage: ArtifactStorage | null = null;
  private classifier: ArtifactClassifier;
  private isRunning = false;

  constructor(config: Partial<WatcherConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.classifier = getClassifier();
  }

  /**
   * Connect to artifact storage for automatic flow
   */
  connectStorage(storage: ArtifactStorage): void {
    this.storage = storage;
  }

  /**
   * Add a path to watch
   */
  addWatchPath(watchPath: string): void {
    if (!this.config.watchPaths.includes(watchPath)) {
      this.config.watchPaths.push(watchPath);
      if (this.watcher) {
        this.watcher.add(watchPath);
      }
    }
  }

  /**
   * Start watching for file changes
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    if (this.config.watchPaths.length === 0) {
      throw new Error('No watch paths configured');
    }

    this.watcher = chokidar.watch(this.config.watchPaths, {
      ignored: this.config.ignoredPatterns,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: this.config.stabilityThreshold,
        pollInterval: 100,
      },
      usePolling: process.platform === 'win32', // More reliable on Windows
      interval: 100,
      binaryInterval: 300,
    });

    this.watcher
      .on('add', (filePath: string, stats?: fs.Stats) => this.handleFileEvent('add', filePath, stats))
      .on('change', (filePath: string, stats?: fs.Stats) => this.handleFileEvent('change', filePath, stats))
      .on('unlink', (filePath: string) => this.handleFileEvent('unlink', filePath))
      .on('error', (err: unknown) => this.emit('error', err instanceof Error ? err : new Error(String(err))))
      .on('ready', () => {
        this.isRunning = true;
        this.emit('ready');
      });

    return new Promise((resolve) => {
      this.once('ready', resolve);
    });
  }

  /**
   * Stop watching for file changes
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.isRunning = false;
      this.emit('stopped');
    }
  }

  /**
   * Check if watcher is running
   */
  running(): boolean {
    return this.isRunning;
  }

  /**
   * Handle a file event
   */
  private async handleFileEvent(
    type: FileEvent['type'],
    filePath: string,
    stats?: fs.Stats
  ): Promise<void> {
    // Normalize path
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Check extension
    const ext = path.extname(normalizedPath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return;
    }

    const event: FileEvent = {
      type,
      path: normalizedPath,
      stats: stats ? {
        size: stats.size,
        mtime: stats.mtime,
      } : undefined,
      timestamp: new Date(),
    };

    // Emit the file event
    this.emit('file', event);

    // If storage is connected and this is an add/change, process the artifact
    if (this.storage && (type === 'add' || type === 'change')) {
      try {
        await this.processArtifact(event);
      } catch (error) {
        this.emit('error', error);
      }
    }
  }

  /**
   * Process a file as an artifact
   */
  private async processArtifact(event: FileEvent): Promise<void> {
    if (!this.storage) return;

    const filePath = event.path;
    const fileName = path.basename(filePath);

    // Read file content
    let content: string | Buffer;
    const ext = path.extname(filePath).toLowerCase();
    const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext);

    try {
      if (isImage) {
        content = fs.readFileSync(filePath);
      } else {
        content = fs.readFileSync(filePath, 'utf-8');
      }
    } catch {
      this.emit('error', new Error(`Failed to read file: ${filePath}`));
      return;
    }

    // Parse frontmatter for markdown files
    let frontmatter: Record<string, unknown> | undefined;
    if (ext === '.md' || ext === '.mdx') {
      try {
        const grayMatter = await import('gray-matter');
        const parsed = grayMatter.default(content as string);
        frontmatter = parsed.data;
        content = parsed.content;
      } catch {
        // Frontmatter parsing failed, use raw content
      }
    }

    // Classify the content
    const context = ArtifactClassifier.createContext(filePath, content, frontmatter);
    const classification = await this.classifier.classify(context);

    // Store if confidence is high enough
    if (classification.confidence >= 0.5) {
      const artifact = await this.storage.store(content, fileName, classification, {
        sourcePath: filePath,
        sourceWorkspace: 'watcher',
      });

      this.emit('artifact', {
        event,
        artifact,
        classification,
      });
    } else {
      this.emit('low-confidence', {
        event,
        classification,
      });
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): WatcherConfig {
    return { ...this.config };
  }

  /**
   * Get watched paths
   */
  getWatchedPaths(): string[] {
    return [...this.config.watchPaths];
  }
}

/**
 * Create a new watcher instance
 */
export function createWatcher(config?: Partial<WatcherConfig>): ArtifactWatcher {
  return new ArtifactWatcher(config);
}

/**
 * Create and start a watcher daemon
 */
export async function startWatcherDaemon(
  watchPaths: string[],
  storage: ArtifactStorage,
  options?: {
    onFile?: (event: FileEvent) => void;
    onArtifact?: (data: { event: FileEvent; artifact: unknown; classification: unknown }) => void;
    onError?: (error: Error) => void;
  }
): Promise<ArtifactWatcher> {
  const watcher = createWatcher({ watchPaths });
  watcher.connectStorage(storage);

  if (options?.onFile) {
    watcher.on('file', options.onFile);
  }

  if (options?.onArtifact) {
    watcher.on('artifact', options.onArtifact);
  }

  if (options?.onError) {
    watcher.on('error', options.onError);
  }

  await watcher.start();
  return watcher;
}
