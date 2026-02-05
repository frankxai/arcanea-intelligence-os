/**
 * Arcanea Artifact Flow - Type Definitions
 *
 * Types for artifact classification, storage, and flow management.
 */

/**
 * Artifact categories for classification
 */
export type ArtifactCategory =
  | 'lore'           // World-building content
  | 'character'      // Character definitions
  | 'location'       // Places in Arcanea
  | 'creature'       // Beasts and beings
  | 'artifact'       // Magical items
  | 'prompt'         // AI prompts
  | 'agent'          // Agent definitions
  | 'code'           // Source code
  | 'image'          // Visual assets
  | 'document'       // General documents
  | 'config'         // Configuration files
  | 'unknown';

/**
 * Elements in the Arcanea universe
 */
export type ArtifactElement =
  | 'fire' | 'water' | 'earth' | 'wind' | 'void' | 'spirit' | 'light' | 'prismatic' | 'arcane' | 'all' | null;

/**
 * Gate numbers (1-10)
 */
export type ArtifactGate = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | null;

/**
 * Result of artifact classification
 */
export interface ClassificationResult {
  category: ArtifactCategory;
  subcategory?: string;
  confidence: number;          // 0-1
  element?: ArtifactElement;
  gate?: ArtifactGate;
  guardian?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  reasoning: string;
}

/**
 * Classification rule definition
 */
export interface ClassifierRule {
  name: string;
  priority: number;
  test: (context: ClassificationContext) => boolean;
  classify: (context: ClassificationContext) => Partial<ClassificationResult>;
}

/**
 * Context passed to classifier rules
 */
export interface ClassificationContext {
  filePath: string;
  fileName: string;
  extension: string;
  content: string | Buffer;
  frontmatter?: Record<string, unknown>;
  parentDir: string;
  pathSegments: string[];
}

/**
 * Stored artifact record
 */
export interface Artifact {
  id: string;
  fileName: string;
  originalPath?: string;
  storagePath: string;
  category: ArtifactCategory;
  subcategory?: string;
  element?: ArtifactElement;
  gate?: ArtifactGate;
  guardian?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  sourceWorkspace?: string;
  checksum: string;
}

/**
 * File event from watcher
 */
export interface FileEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  stats?: {
    size: number;
    mtime: Date;
  };
  timestamp: Date;
}

/**
 * Watcher configuration
 */
export interface WatcherConfig {
  watchPaths: string[];
  ignoredPatterns: string[];
  debounceMs: number;
  stabilityThreshold: number;
}

/**
 * Flow configuration stored in .flow-config.json
 */
export interface FlowConfig {
  version: string;
  studioPath: string;
  watchPaths: string[];
  ignoredPatterns: string[];
  autoClassify: boolean;
  autoStore: boolean;
  debounceMs: number;
  stabilityThreshold: number;
}

/**
 * Search query options
 */
export interface SearchOptions {
  query: string;
  category?: ArtifactCategory;
  element?: ArtifactElement;
  gate?: ArtifactGate;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Search result
 */
export interface SearchResult {
  artifact: Artifact;
  score: number;
  highlights?: string[];
}
