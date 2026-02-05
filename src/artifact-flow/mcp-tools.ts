/**
 * Arcanea Artifact Flow - MCP Tools
 *
 * MCP tool definitions for artifact management.
 * These tools integrate with Claude Code for seamless artifact flow.
 */

import { ArtifactClassifier, getClassifier } from './classifier';
import { ArtifactStorage, createStorage } from './storage';
import {
  Artifact,
  ArtifactCategory,
  ArtifactElement,
  ClassificationResult,
  SearchResult,
} from './types';

/**
 * MCP Tool definition interface
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Artifact flow MCP tools
 */
export const ARTIFACT_TOOLS: MCPTool[] = [
  {
    name: 'arcanea_store_artifact',
    description: 'Store a new artifact in Arcanea Studio. Automatically classifies the content by type, element, and gate alignment.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The artifact content (text or base64 for binary files)',
        },
        fileName: {
          type: 'string',
          description: 'File name including extension (e.g., "draconia-backstory.md")',
        },
        category: {
          type: 'string',
          enum: ['lore', 'character', 'location', 'creature', 'artifact', 'prompt', 'agent', 'code', 'image', 'document', 'config'],
          description: 'Optional: Override automatic classification',
        },
        element: {
          type: 'string',
          enum: ['fire', 'water', 'earth', 'wind', 'void', 'spirit', 'light', 'arcane', 'all'],
          description: 'Optional: Elemental alignment',
        },
        gate: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          description: 'Optional: Gate number (1-10)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: Tags for organization',
        },
        sourcePath: {
          type: 'string',
          description: 'Optional: Original file path',
        },
      },
      required: ['content', 'fileName'],
    },
  },
  {
    name: 'arcanea_search_artifacts',
    description: 'Search for artifacts in Arcanea Studio by query, category, element, or tags.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (searches names, tags, and content)',
        },
        category: {
          type: 'string',
          enum: ['lore', 'character', 'location', 'creature', 'artifact', 'prompt', 'agent', 'code', 'image', 'document', 'config'],
          description: 'Filter by category',
        },
        element: {
          type: 'string',
          enum: ['fire', 'water', 'earth', 'wind', 'void', 'spirit', 'light', 'arcane', 'all'],
          description: 'Filter by element',
        },
        gate: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          description: 'Filter by gate number',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags (all must match)',
        },
        limit: {
          type: 'number',
          default: 20,
          description: 'Maximum results to return',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'arcanea_get_artifact',
    description: 'Retrieve a specific artifact by its ID, including content.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Artifact ID',
        },
        includeContent: {
          type: 'boolean',
          default: true,
          description: 'Whether to include the artifact content',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'arcanea_list_artifacts',
    description: 'List artifacts by category or get all artifacts.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['lore', 'character', 'location', 'creature', 'artifact', 'prompt', 'agent', 'code', 'image', 'document', 'config'],
          description: 'Filter by category (omit for all)',
        },
        limit: {
          type: 'number',
          default: 50,
          description: 'Maximum results to return',
        },
        offset: {
          type: 'number',
          default: 0,
          description: 'Offset for pagination',
        },
      },
    },
  },
  {
    name: 'arcanea_classify_content',
    description: 'Classify content without storing it. Returns classification result with confidence score.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Content to classify',
        },
        fileName: {
          type: 'string',
          description: 'File name for context',
        },
        filePath: {
          type: 'string',
          description: 'Optional: Full file path for better classification',
        },
      },
      required: ['content', 'fileName'],
    },
  },
  {
    name: 'arcanea_update_artifact',
    description: 'Update an artifact\'s metadata, tags, or category.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Artifact ID',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags (replaces existing)',
        },
        category: {
          type: 'string',
          enum: ['lore', 'character', 'location', 'creature', 'artifact', 'prompt', 'agent', 'code', 'image', 'document', 'config'],
          description: 'New category',
        },
        subcategory: {
          type: 'string',
          description: 'New subcategory',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata to merge',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'arcanea_delete_artifact',
    description: 'Delete an artifact (moves to archive, can be recovered).',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Artifact ID to delete',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'arcanea_studio_stats',
    description: 'Get statistics about the Arcanea Studio artifact collection.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Tool handler type
 */
export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

/**
 * Create tool handlers for artifact flow
 */
export function createToolHandlers(storage: ArtifactStorage): Record<string, ToolHandler> {
  const classifier = getClassifier();

  return {
    arcanea_store_artifact: async (args: Record<string, unknown>) => {
      const content = args.content as string;
      const fileName = args.fileName as string;

      // Create classification context
      const context = ArtifactClassifier.createContext(
        args.filePath as string || fileName,
        content
      );

      // Classify the content
      let classification = await classifier.classify(context);

      // Apply overrides if provided
      if (args.category) {
        classification = {
          ...classification,
          category: args.category as ArtifactCategory,
          confidence: 1.0,
        };
      }
      if (args.element) {
        classification.element = args.element as ArtifactElement;
      }
      if (args.gate) {
        classification.gate = args.gate as ClassificationResult['gate'];
      }
      if (args.tags) {
        classification.tags = [...new Set([...classification.tags, ...(args.tags as string[])])];
      }

      // Store the artifact
      const artifact = await storage.store(content, fileName, classification, {
        sourcePath: args.sourcePath as string | undefined,
        sourceWorkspace: 'claude-code',
      });

      return {
        success: true,
        artifact: {
          id: artifact.id,
          fileName: artifact.fileName,
          storagePath: artifact.storagePath,
          category: artifact.category,
          element: artifact.element,
          gate: artifact.gate,
          guardian: artifact.guardian,
          tags: artifact.tags,
        },
        classification: {
          confidence: classification.confidence,
          reasoning: classification.reasoning,
        },
      };
    },

    arcanea_search_artifacts: async (args: Record<string, unknown>) => {
      const gateNum = args.gate as number | undefined;
      const gate = gateNum && gateNum >= 1 && gateNum <= 10
        ? (gateNum as ClassificationResult['gate'])
        : undefined;

      const results = await storage.search({
        query: args.query as string,
        category: args.category as ArtifactCategory | undefined,
        element: args.element as ArtifactElement | undefined,
        gate,
        tags: args.tags as string[] | undefined,
        limit: (args.limit as number) || 20,
      });

      return {
        count: results.length,
        artifacts: results.map((r: SearchResult) => ({
          id: r.artifact.id,
          fileName: r.artifact.fileName,
          category: r.artifact.category,
          element: r.artifact.element,
          gate: r.artifact.gate,
          guardian: r.artifact.guardian,
          tags: r.artifact.tags,
          score: r.score,
        })),
      };
    },

    arcanea_get_artifact: async (args: Record<string, unknown>) => {
      const artifact = await storage.get(args.id as string);
      if (!artifact) {
        return { error: 'Artifact not found', id: args.id };
      }

      const result: Record<string, unknown> = { artifact };

      if (args.includeContent !== false) {
        const content = await storage.getContent(args.id as string);
        result.content = content;
      }

      return result;
    },

    arcanea_list_artifacts: async (args: Record<string, unknown>) => {
      const artifacts = await storage.list(args.category as ArtifactCategory | undefined);
      const offset = (args.offset as number) || 0;
      const limit = (args.limit as number) || 50;

      const paged = artifacts.slice(offset, offset + limit);

      return {
        total: artifacts.length,
        count: paged.length,
        offset,
        artifacts: paged.map((a: Artifact) => ({
          id: a.id,
          fileName: a.fileName,
          category: a.category,
          element: a.element,
          gate: a.gate,
          guardian: a.guardian,
          tags: a.tags,
          createdAt: a.createdAt.toISOString(),
        })),
      };
    },

    arcanea_classify_content: async (args: Record<string, unknown>) => {
      const context = ArtifactClassifier.createContext(
        args.filePath as string || args.fileName as string,
        args.content as string
      );

      const result = await classifier.classify(context);

      return {
        classification: result,
        suggestedPath: `artifacts/${result.category}/${args.fileName}`,
      };
    },

    arcanea_update_artifact: async (args: Record<string, unknown>) => {
      const updates: Record<string, unknown> = {};
      if (args.tags) updates.tags = args.tags;
      if (args.category) updates.category = args.category;
      if (args.subcategory) updates.subcategory = args.subcategory;
      if (args.metadata) updates.metadata = args.metadata;

      const artifact = await storage.update(args.id as string, updates);
      if (!artifact) {
        return { error: 'Artifact not found', id: args.id };
      }

      return { success: true, artifact };
    },

    arcanea_delete_artifact: async (args: Record<string, unknown>) => {
      const deleted = await storage.delete(args.id as string);
      return {
        success: deleted,
        message: deleted ? 'Artifact moved to archive' : 'Artifact not found',
      };
    },

    arcanea_studio_stats: async () => {
      const stats = await storage.getStats();
      return {
        ...stats,
        recentlyAdded: stats.recentlyAdded.map((a: Artifact) => ({
          id: a.id,
          fileName: a.fileName,
          category: a.category,
          createdAt: a.createdAt.toISOString(),
        })),
      };
    },
  };
}
