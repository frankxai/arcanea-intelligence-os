/**
 * Arcanea Artifact Flow
 *
 * Automatic artifact classification and storage system for Arcanea Studio.
 *
 * @example
 * ```typescript
 * import { createStorage, getClassifier, ArtifactClassifier } from '@arcanea/intelligence-os/artifact-flow';
 *
 * // Initialize storage
 * const storage = createStorage('/path/to/arcanea-studio');
 * await storage.initialize();
 *
 * // Classify content
 * const classifier = getClassifier();
 * const context = ArtifactClassifier.createContext('path/to/file.md', content);
 * const classification = await classifier.classify(context);
 *
 * // Store artifact
 * const artifact = await storage.store(content, 'file.md', classification);
 * ```
 */

// Type exports
export type {
  Artifact,
  ArtifactCategory,
  ArtifactElement,
  ArtifactGate,
  ClassificationContext,
  ClassificationResult,
  ClassifierRule,
  FileEvent,
  FlowConfig,
  SearchOptions,
  SearchResult,
  WatcherConfig,
} from './types';

// Classifier exports
export { ArtifactClassifier, getClassifier } from './classifier';

// Storage exports
export { ArtifactStorage, createStorage } from './storage';

// Watcher exports
export { ArtifactWatcher, createWatcher, startWatcherDaemon } from './watcher';

// MCP tool exports
export { ARTIFACT_TOOLS, createToolHandlers } from './mcp-tools';
export type { MCPTool, ToolHandler } from './mcp-tools';
