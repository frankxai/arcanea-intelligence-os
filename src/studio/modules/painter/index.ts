/**
 * PAINTER Module - Image Generation
 *
 * Generates visual art for worldbuilding including:
 * - Character portraits
 * - Location art
 * - Artifact renders
 * - Scene illustrations
 * - Trading cards
 * - Maps
 */

import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { GATES, type GateName, type Element } from '../../../index';
import type {
  ImageAsset,
  ArtStyle,
  StylePreset,
  ImageGenerationParams,
  Character,
  Location,
  Artifact,
} from '../../types';

// =============================================================================
// STYLE PRESETS
// =============================================================================

export const STYLE_PRESETS: Record<string, StylePreset> = {
  'arcanea-classic': {
    name: 'Arcanea Classic',
    style: 'arcanea-classic',
    description: 'Official Arcanea art style - ethereal, magical, luminous',
    promptModifiers: [
      'Arcanea fantasy art style',
      'ethereal lighting',
      'magical atmosphere',
      'luminous colors',
      'detailed fantasy illustration',
      'professional digital art',
    ],
    negativePrompt: 'blurry, low quality, distorted, ugly, deformed',
  },
  'dark-fantasy': {
    name: 'Dark Fantasy',
    style: 'dark-fantasy',
    description: 'Gritty, atmospheric, moody fantasy',
    promptModifiers: [
      'dark fantasy art',
      'moody atmosphere',
      'dramatic shadows',
      'rich textures',
      'cinematic lighting',
    ],
    negativePrompt: 'bright, cheerful, cartoon, anime',
  },
  'anime': {
    name: 'Anime',
    style: 'anime',
    description: 'Japanese anime illustration style',
    promptModifiers: [
      'anime style',
      'vibrant colors',
      'clean lines',
      'expressive eyes',
      'dynamic pose',
    ],
    negativePrompt: 'realistic, photo, western art',
  },
  'concept-art': {
    name: 'Concept Art',
    style: 'concept-art',
    description: 'Professional game/film concept art',
    promptModifiers: [
      'concept art',
      'professional illustration',
      'highly detailed',
      'artstation quality',
      'cinematic',
    ],
    negativePrompt: 'amateur, sketch, rough',
  },
  'epic': {
    name: 'Epic',
    style: 'epic',
    description: 'Grand, cinematic, heroic scale',
    promptModifiers: [
      'epic fantasy',
      'grand scale',
      'dramatic',
      'heroic',
      'cinematic composition',
      'majestic',
    ],
    negativePrompt: 'small, mundane, boring',
  },
};

// Gate-specific style modifiers
export const GATE_STYLE_MODIFIERS: Record<GateName, string[]> = {
  foundation: ['earthy tones', 'grounded', 'stable', 'warm browns and greens'],
  flow: ['fluid forms', 'water effects', 'blues and silvers', 'flowing movement'],
  fire: ['fiery effects', 'warm oranges and reds', 'dynamic energy', 'intense'],
  heart: ['soft lighting', 'warm glow', 'pink and gold hues', 'loving atmosphere'],
  voice: ['prismatic colors', 'sound visualization', 'rainbow effects', 'expressive'],
  sight: ['ethereal mist', 'airy composition', 'pale blues and whites', 'visionary'],
  crown: ['cosmic elements', 'void energy', 'deep purples and blacks', 'transcendent'],
  shift: ['transformation effects', 'arcane symbols', 'shifting forms', 'mystical'],
  unity: ['harmony', 'interconnected patterns', 'balanced composition', 'unified'],
  source: ['pure light', 'golden radiance', 'divine presence', 'ultimate power'],
};

// =============================================================================
// PAINTER CONFIGURATION
// =============================================================================

export interface PainterConfig {
  provider: 'gemini' | 'dalle' | 'midjourney' | 'flux' | 'local';
  apiKey?: string;
  outputDir: string;
  defaultStyle: ArtStyle;
  defaultQuality: 'draft' | 'standard' | 'high' | 'ultra';
}

const DEFAULT_CONFIG: PainterConfig = {
  provider: 'gemini',
  outputDir: path.join(process.env.HOME || process.env.USERPROFILE || '', '.arcanea', 'gallery'),
  defaultStyle: 'arcanea-classic',
  defaultQuality: 'high',
};

// =============================================================================
// PAINTER CLASS
// =============================================================================

export class Painter {
  private config: PainterConfig;
  private genAI: GoogleGenerativeAI | null = null;

  constructor(config: Partial<PainterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize Gemini if API key provided
    const apiKey = this.config.apiKey || process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a character portrait
   */
  async generatePortrait(
    character: Partial<Character>,
    style?: ArtStyle
  ): Promise<{
    prompt: string;
    imageData?: string;
    filePath?: string;
  }> {
    const effectiveStyle = style || this.config.defaultStyle;
    const prompt = this.buildCharacterPrompt(character, effectiveStyle);

    // In production, call image generation API
    // For now, return the prompt
    return {
      prompt,
    };
  }

  /**
   * Generate location art
   */
  async generateLocationArt(
    location: Partial<Location>,
    style?: ArtStyle
  ): Promise<{
    prompt: string;
    imageData?: string;
    filePath?: string;
  }> {
    const effectiveStyle = style || this.config.defaultStyle;
    const prompt = this.buildLocationPrompt(location, effectiveStyle);

    return {
      prompt,
    };
  }

  /**
   * Generate artifact render
   */
  async generateArtifactRender(
    artifact: Partial<Artifact>,
    style?: ArtStyle
  ): Promise<{
    prompt: string;
    imageData?: string;
    filePath?: string;
  }> {
    const effectiveStyle = style || this.config.defaultStyle;
    const prompt = this.buildArtifactPrompt(artifact, effectiveStyle);

    return {
      prompt,
    };
  }

  /**
   * Generate a scene illustration
   */
  async generateScene(params: {
    description: string;
    characters?: Partial<Character>[];
    location?: Partial<Location>;
    mood?: string;
    action?: string;
    style?: ArtStyle;
    gate?: GateName;
  }): Promise<{
    prompt: string;
    imageData?: string;
    filePath?: string;
  }> {
    const effectiveStyle = params.style || this.config.defaultStyle;
    const stylePreset = STYLE_PRESETS[effectiveStyle] || STYLE_PRESETS['arcanea-classic'];
    const gateModifiers = params.gate ? GATE_STYLE_MODIFIERS[params.gate] : [];

    const elements = [
      params.description,
      params.mood ? `${params.mood} atmosphere` : null,
      params.action ? `${params.action}` : null,
      params.location?.name ? `in ${params.location.name}` : null,
      ...stylePreset.promptModifiers,
      ...gateModifiers,
    ].filter(Boolean);

    const prompt = elements.join(', ');

    return {
      prompt,
    };
  }

  /**
   * Generate a trading card style image
   */
  async generateCard(
    entity: Partial<Character> | Partial<Location> | Partial<Artifact>,
    template: 'character' | 'location' | 'artifact' | 'spell'
  ): Promise<{
    prompt: string;
    imageData?: string;
    filePath?: string;
  }> {
    const basePrompt = this.getEntityDescription(entity);

    const cardModifiers = [
      'trading card art',
      'card game illustration',
      'bordered frame',
      'high detail',
      'collectible card style',
      'professional TCG art',
    ];

    const prompt = `${basePrompt}, ${cardModifiers.join(', ')}`;

    return {
      prompt,
    };
  }

  /**
   * Generate a map
   */
  async generateMap(params: {
    name: string;
    type: 'world' | 'region' | 'city' | 'dungeon' | 'building';
    locations?: string[];
    style?: 'fantasy' | 'realistic' | 'stylized' | 'ancient';
    gate?: GateName;
  }): Promise<{
    prompt: string;
    imageData?: string;
    filePath?: string;
  }> {
    const mapStyle = params.style || 'fantasy';
    const gateModifiers = params.gate ? GATE_STYLE_MODIFIERS[params.gate] : [];

    const elements = [
      `${mapStyle} map of ${params.name}`,
      `${params.type} map`,
      params.locations ? `showing ${params.locations.join(', ')}` : null,
      'detailed cartography',
      'labeled locations',
      'compass rose',
      'decorative border',
      'parchment texture',
      ...gateModifiers,
    ].filter(Boolean);

    const prompt = elements.join(', ');

    return {
      prompt,
    };
  }

  /**
   * Apply style preset to a prompt
   */
  applyStyle(basePrompt: string, style: ArtStyle, gate?: GateName): string {
    const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS['arcanea-classic'];
    const gateModifiers = gate ? GATE_STYLE_MODIFIERS[gate] : [];

    return [
      basePrompt,
      ...stylePreset.promptModifiers,
      ...gateModifiers,
    ].join(', ');
  }

  /**
   * Get available style presets
   */
  getStylePresets(): StylePreset[] {
    return Object.values(STYLE_PRESETS);
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private buildCharacterPrompt(character: Partial<Character>, style: ArtStyle): string {
    const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS['arcanea-classic'];
    const gateModifiers = character.gate ? GATE_STYLE_MODIFIERS[character.gate] : [];

    const elements = [
      'character portrait',
      character.name ? `of ${character.name}` : null,
      character.epithet ? `(${character.epithet})` : null,
      character.species ? `a ${character.species}` : null,
      character.gender ? character.gender : null,

      // Appearance
      character.appearance?.build ? `${character.appearance.build} build` : null,
      character.appearance?.hairColor ? `${character.appearance.hairColor} hair` : null,
      character.appearance?.hairStyle ? `${character.appearance.hairStyle}` : null,
      character.appearance?.eyeColor ? `${character.appearance.eyeColor} eyes` : null,
      character.appearance?.skinTone ? `${character.appearance.skinTone} skin` : null,
      character.appearance?.distinguishingFeatures?.length
        ? character.appearance.distinguishingFeatures.join(', ')
        : null,
      character.appearance?.clothing ? `wearing ${character.appearance.clothing}` : null,

      // Arcanea elements
      character.element ? `${character.element} elemental aura` : null,
      character.gate ? `aligned with ${character.gate} gate` : null,

      // Style modifiers
      ...stylePreset.promptModifiers,
      ...gateModifiers,
    ].filter(Boolean);

    return elements.join(', ');
  }

  private buildLocationPrompt(location: Partial<Location>, style: ArtStyle): string {
    const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS['arcanea-classic'];
    const gateModifiers = location.gate ? GATE_STYLE_MODIFIERS[location.gate] : [];

    const elements = [
      location.type ? `${location.type}` : 'fantasy location',
      location.name ? `called ${location.name}` : null,
      location.atmosphere ? `${location.atmosphere} atmosphere` : null,
      location.geography?.terrain ? `terrain: ${location.geography.terrain.join(', ')}` : null,
      location.geography?.climate ? `${location.geography.climate} climate` : null,
      location.element ? `${location.element} elemental influence` : null,
      'wide landscape view',
      'environmental art',
      ...stylePreset.promptModifiers,
      ...gateModifiers,
    ].filter(Boolean);

    return elements.join(', ');
  }

  private buildArtifactPrompt(artifact: Partial<Artifact>, style: ArtStyle): string {
    const stylePreset = STYLE_PRESETS[style] || STYLE_PRESETS['arcanea-classic'];
    const gateModifiers = artifact.gate ? GATE_STYLE_MODIFIERS[artifact.gate] : [];

    const elements = [
      artifact.type ? `${artifact.type}` : 'magical artifact',
      artifact.name ? `called ${artifact.name}` : null,
      artifact.appearance ? artifact.appearance : null,
      artifact.element ? `${artifact.element} elemental energy` : null,
      artifact.powerLevel ? `${artifact.powerLevel} power` : null,
      'item showcase',
      'detailed render',
      'magical glow',
      'dark background',
      ...stylePreset.promptModifiers,
      ...gateModifiers,
    ].filter(Boolean);

    return elements.join(', ');
  }

  private getEntityDescription(entity: any): string {
    if (entity.species) {
      // Character
      return this.buildCharacterPrompt(entity, this.config.defaultStyle);
    } else if (entity.terrain || entity.atmosphere) {
      // Location
      return this.buildLocationPrompt(entity, this.config.defaultStyle);
    } else if (entity.powerLevel) {
      // Artifact
      return this.buildArtifactPrompt(entity, this.config.defaultStyle);
    }
    return entity.name || entity.description || 'fantasy entity';
  }

  private generateId(): string {
    return `img_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export function createPainter(config?: Partial<PainterConfig>): Painter {
  return new Painter(config);
}

export default Painter;
