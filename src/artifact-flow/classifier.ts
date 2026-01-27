/**
 * Arcanea Artifact Flow - Classifier
 *
 * Multi-stage classification engine for Arcanea artifacts.
 * Classifies files based on extension, path, content, and Arcanea-specific patterns.
 */

import * as path from 'path';
import {
  ArtifactCategory,
  ArtifactElement,
  ArtifactGate,
  ClassificationContext,
  ClassificationResult,
  ClassifierRule,
} from './types';

/**
 * Guardian to Gate mapping
 */
const GUARDIAN_GATE_MAP: Record<string, ArtifactGate> = {
  lyssandria: 1,
  leyla: 2,
  draconia: 3,
  maylinn: 4,
  alera: 5,
  lyria: 6,
  aiyami: 7,
  elara: 8,
  ino: 9,
  shinkami: 10,
};

/**
 * Gate to Element mapping
 */
const GATE_ELEMENT_MAP: Record<number, ArtifactElement> = {
  1: 'earth',      // Foundation - Lyssandria
  2: 'water',      // Flow - Leyla
  3: 'fire',       // Fire - Draconia
  4: 'light',      // Heart - Maylinn
  5: 'prismatic',  // Voice - Alera
  6: 'wind',       // Sight - Lyria
  7: 'void',       // Crown - Aiyami
  8: 'arcane',     // Shift - Elara
  9: 'arcane',     // Unity - Ino
  10: 'arcane',    // Source - Shinkami
};

/**
 * Guardian names for detection
 */
const GUARDIANS = Object.keys(GUARDIAN_GATE_MAP);

/**
 * Image extensions
 */
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'];

/**
 * Code extensions
 */
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];

/**
 * Data/config extensions
 */
const CONFIG_EXTENSIONS = ['.json', '.yaml', '.yml', '.toml', '.xml'];

/**
 * Document extensions
 */
const DOCUMENT_EXTENSIONS = ['.md', '.mdx', '.txt', '.rst', '.doc', '.docx'];

/**
 * Artifact Classifier
 *
 * Uses a priority-based rule system to classify artifacts.
 * Higher priority rules are evaluated first.
 */
export class ArtifactClassifier {
  private rules: ClassifierRule[] = [];

  constructor() {
    this.registerDefaultRules();
  }

  /**
   * Register a classification rule
   */
  addRule(rule: ClassifierRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Classify an artifact
   */
  async classify(context: ClassificationContext): Promise<ClassificationResult> {
    const results: Partial<ClassificationResult>[] = [];

    for (const rule of this.rules) {
      try {
        if (rule.test(context)) {
          const result = rule.classify(context);
          results.push(result);
        }
      } catch {
        // Skip rules that throw errors
      }
    }

    return this.mergeResults(results);
  }

  /**
   * Create classification context from file info
   */
  static createContext(
    filePath: string,
    content: string | Buffer,
    frontmatter?: Record<string, unknown>
  ): ClassificationContext {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const segments = normalizedPath.split('/').filter(Boolean);

    return {
      filePath: normalizedPath,
      fileName: path.basename(normalizedPath),
      extension: path.extname(normalizedPath).toLowerCase(),
      content,
      frontmatter,
      parentDir: path.dirname(normalizedPath),
      pathSegments: segments,
    };
  }

  /**
   * Register default classification rules
   */
  private registerDefaultRules(): void {
    // Rule 1: Frontmatter type field (highest priority)
    this.addRule({
      name: 'frontmatter-type',
      priority: 100,
      test: (ctx) => !!ctx.frontmatter?.type,
      classify: (ctx) => ({
        category: this.mapFrontmatterType(String(ctx.frontmatter!.type)),
        confidence: 0.95,
        tags: Array.isArray(ctx.frontmatter?.tags) ? ctx.frontmatter.tags as string[] : [],
        metadata: ctx.frontmatter as Record<string, unknown>,
        reasoning: `Frontmatter type field: ${ctx.frontmatter!.type}`,
      }),
    });

    // Rule 2: Path-based classification (agents)
    this.addRule({
      name: 'path-agents',
      priority: 90,
      test: (ctx) => ctx.pathSegments.includes('agents'),
      classify: (ctx) => {
        const guardian = this.detectGuardianFromPath(ctx.pathSegments);
        return {
          category: 'agent',
          confidence: 0.9,
          guardian,
          gate: guardian ? GUARDIAN_GATE_MAP[guardian] : null,
          reasoning: 'Located in agents directory',
        };
      },
    });

    // Rule 2b: Path-based classification (prompts)
    this.addRule({
      name: 'path-prompts',
      priority: 90,
      test: (ctx) => ctx.pathSegments.includes('prompts'),
      classify: () => ({
        category: 'prompt',
        confidence: 0.9,
        reasoning: 'Located in prompts directory',
      }),
    });

    // Rule 2c: Path-based classification (lore)
    this.addRule({
      name: 'path-lore',
      priority: 90,
      test: (ctx) =>
        ctx.pathSegments.includes('lore') ||
        ctx.pathSegments.includes('arcanea-lore') ||
        ctx.pathSegments.includes('story'),
      classify: () => ({
        category: 'lore',
        confidence: 0.85,
        reasoning: 'Located in lore/story directory',
      }),
    });

    // Rule 2d: Path-based classification (skills)
    this.addRule({
      name: 'path-skills',
      priority: 90,
      test: (ctx) => ctx.pathSegments.includes('skills'),
      classify: (ctx) => {
        const gateMatch = ctx.pathSegments.find(s => s.includes('-gate'));
        const gateName = gateMatch?.replace('-gate', '');
        return {
          category: 'prompt',
          subcategory: 'skill',
          confidence: 0.9,
          tags: gateName ? [gateName, 'gate-skill'] : ['gate-skill'],
          reasoning: 'Located in skills directory',
        };
      },
    });

    // Rule 3: Extension-based classification (images)
    this.addRule({
      name: 'extension-image',
      priority: 80,
      test: (ctx) => IMAGE_EXTENSIONS.includes(ctx.extension),
      classify: (ctx) => ({
        category: 'image',
        confidence: 0.95,
        tags: [ctx.extension.slice(1)],
        reasoning: `Image file extension: ${ctx.extension}`,
      }),
    });

    // Rule 3b: Extension-based classification (code)
    this.addRule({
      name: 'extension-code',
      priority: 80,
      test: (ctx) => CODE_EXTENSIONS.includes(ctx.extension),
      classify: (ctx) => ({
        category: 'code',
        confidence: 0.9,
        tags: [ctx.extension.slice(1)],
        reasoning: `Code file extension: ${ctx.extension}`,
      }),
    });

    // Rule 3c: Arcanean Prompt Language
    this.addRule({
      name: 'extension-arc',
      priority: 85,
      test: (ctx) => ctx.extension === '.arc',
      classify: () => ({
        category: 'prompt',
        subcategory: 'arcanean-prompt-language',
        confidence: 0.95,
        reasoning: 'Arcanean Prompt Language file',
      }),
    });

    // Rule 4: Content analysis - character detection
    this.addRule({
      name: 'content-character',
      priority: 70,
      test: (ctx) => {
        if (Buffer.isBuffer(ctx.content)) return false;
        const content = ctx.content.toLowerCase();
        const keywords = ['character', 'backstory', 'personality', 'abilities', 'motivation'];
        const matches = keywords.filter(k => content.includes(k));
        return matches.length >= 2;
      },
      classify: () => ({
        category: 'character',
        confidence: 0.75,
        reasoning: 'Content contains multiple character-related keywords',
      }),
    });

    // Rule 4b: Content analysis - location detection
    this.addRule({
      name: 'content-location',
      priority: 70,
      test: (ctx) => {
        if (Buffer.isBuffer(ctx.content)) return false;
        const content = ctx.content.toLowerCase();
        const keywords = ['location', 'geography', 'climate', 'inhabitants', 'landmark', 'realm'];
        const matches = keywords.filter(k => content.includes(k));
        return matches.length >= 2;
      },
      classify: () => ({
        category: 'location',
        confidence: 0.75,
        reasoning: 'Content contains multiple location-related keywords',
      }),
    });

    // Rule 5: Arcanea-specific - Guardian detection
    this.addRule({
      name: 'arcanea-guardian',
      priority: 75,
      test: (ctx) => {
        if (Buffer.isBuffer(ctx.content)) return false;
        const content = ctx.content.toLowerCase();
        return GUARDIANS.some(g => content.includes(g));
      },
      classify: (ctx) => {
        const content = Buffer.isBuffer(ctx.content) ? '' : ctx.content.toLowerCase();
        const guardian = this.detectGuardian(content);
        const gate = guardian ? GUARDIAN_GATE_MAP[guardian] : null;
        return {
          category: 'lore',
          guardian,
          gate,
          element: gate ? GATE_ELEMENT_MAP[gate] : null,
          confidence: 0.8,
          tags: ['guardian', guardian!].filter(Boolean),
          reasoning: `Contains Guardian reference: ${guardian}`,
        };
      },
    });

    // Rule 5b: Arcanea-specific - Gate detection
    this.addRule({
      name: 'arcanea-gate',
      priority: 70,
      test: (ctx) => {
        if (Buffer.isBuffer(ctx.content)) return false;
        const content = ctx.content.toLowerCase();
        const gateKeywords = ['foundation gate', 'flow gate', 'fire gate', 'heart gate',
          'voice gate', 'sight gate', 'crown gate', 'shift gate', 'unity gate', 'source gate'];
        return gateKeywords.some(k => content.includes(k));
      },
      classify: (ctx) => {
        const content = Buffer.isBuffer(ctx.content) ? '' : ctx.content.toLowerCase();
        const gate = this.detectGateFromContent(content);
        return {
          gate,
          element: gate ? GATE_ELEMENT_MAP[gate] : null,
          tags: gate ? [`gate-${gate}`] : [],
          confidence: 0.7,
          reasoning: `Contains Gate reference`,
        };
      },
    });

    // Rule 5c: Element detection
    this.addRule({
      name: 'arcanea-element',
      priority: 65,
      test: (ctx) => {
        if (Buffer.isBuffer(ctx.content)) return false;
        const content = ctx.content.toLowerCase();
        const elementKeywords = ['fire element', 'water element', 'earth element',
          'wind element', 'void element', 'spirit element', 'light element', 'arcane element'];
        return elementKeywords.some(k => content.includes(k));
      },
      classify: (ctx) => {
        const content = Buffer.isBuffer(ctx.content) ? '' : ctx.content.toLowerCase();
        const element = this.detectElement(content);
        return {
          element,
          tags: element ? [element] : [],
          confidence: 0.6,
          reasoning: `Contains elemental reference: ${element}`,
        };
      },
    });

    // Rule 6: Config files
    this.addRule({
      name: 'extension-config',
      priority: 60,
      test: (ctx) => CONFIG_EXTENSIONS.includes(ctx.extension),
      classify: (ctx) => ({
        category: 'config',
        confidence: 0.85,
        tags: [ctx.extension.slice(1)],
        reasoning: `Config file extension: ${ctx.extension}`,
      }),
    });

    // Rule 7: Default document fallback
    this.addRule({
      name: 'default-document',
      priority: 10,
      test: (ctx) => DOCUMENT_EXTENSIONS.includes(ctx.extension),
      classify: () => ({
        category: 'document',
        confidence: 0.5,
        reasoning: 'Default classification as document',
      }),
    });

    // Rule 8: Ultimate fallback
    this.addRule({
      name: 'default',
      priority: 0,
      test: () => true,
      classify: () => ({
        category: 'unknown',
        confidence: 0.3,
        reasoning: 'Default fallback classification',
      }),
    });
  }

  /**
   * Merge multiple classification results
   */
  private mergeResults(results: Partial<ClassificationResult>[]): ClassificationResult {
    const merged: ClassificationResult = {
      category: 'unknown',
      confidence: 0,
      tags: [],
      metadata: {},
      reasoning: '',
    };

    for (const result of results) {
      // Use category with highest confidence
      if (result.category && (result.confidence || 0) > merged.confidence) {
        merged.category = result.category;
        merged.confidence = result.confidence || 0;
        merged.reasoning = result.reasoning || '';
      }

      // Merge other fields
      if (result.subcategory) merged.subcategory = result.subcategory;
      if (result.element) merged.element = result.element;
      if (result.gate) merged.gate = result.gate;
      if (result.guardian) merged.guardian = result.guardian;
      if (result.tags) merged.tags = [...new Set([...merged.tags, ...result.tags])];
      if (result.metadata) merged.metadata = { ...merged.metadata, ...result.metadata };
    }

    return merged;
  }

  /**
   * Map frontmatter type to category
   */
  private mapFrontmatterType(type: string): ArtifactCategory {
    const mapping: Record<string, ArtifactCategory> = {
      character: 'character',
      location: 'location',
      creature: 'creature',
      artifact: 'artifact',
      prompt: 'prompt',
      agent: 'agent',
      lore: 'lore',
      code: 'code',
      image: 'image',
      config: 'config',
      document: 'document',
    };
    return mapping[type.toLowerCase()] || 'document';
  }

  /**
   * Detect guardian name from content
   */
  private detectGuardian(content: string): string | undefined {
    return GUARDIANS.find(g => content.includes(g));
  }

  /**
   * Detect guardian from path segments
   */
  private detectGuardianFromPath(segments: string[]): string | undefined {
    for (const segment of segments) {
      const normalized = segment.toLowerCase().replace(/\.md$/, '');
      if (GUARDIANS.includes(normalized)) {
        return normalized;
      }
    }
    return undefined;
  }

  /**
   * Detect gate number from content
   */
  private detectGateFromContent(content: string): ArtifactGate {
    const gateNames: Array<[string, ArtifactGate]> = [
      ['foundation gate', 1],
      ['flow gate', 2],
      ['fire gate', 3],
      ['heart gate', 4],
      ['voice gate', 5],
      ['sight gate', 6],
      ['crown gate', 7],
      ['shift gate', 8],
      ['unity gate', 9],
      ['source gate', 10],
    ];

    for (const [name, gate] of gateNames) {
      if (content.includes(name)) {
        return gate;
      }
    }
    return null;
  }

  /**
   * Detect element from content
   */
  private detectElement(content: string): ArtifactElement {
    const elements: ArtifactElement[] = ['fire', 'water', 'earth', 'wind', 'void', 'spirit', 'light', 'arcane'];
    for (const element of elements) {
      if (content.includes(`${element} element`) || content.includes(`${element} magic`)) {
        return element;
      }
    }
    return null;
  }
}

/**
 * Singleton classifier instance
 */
let classifierInstance: ArtifactClassifier | null = null;

/**
 * Get or create the classifier instance
 */
export function getClassifier(): ArtifactClassifier {
  if (!classifierInstance) {
    classifierInstance = new ArtifactClassifier();
  }
  return classifierInstance;
}
