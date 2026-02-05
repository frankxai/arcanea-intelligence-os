/**
 * FILMMAKER Module - Video Generation
 *
 * Generates video content for worldbuilding including:
 * - Scene cinematics
 * - Character introductions
 * - Location flyovers
 * - Promotional trailers
 * - Lore documentaries
 * - Short-form content (TikTok, Reels, Shorts)
 */

import * as fs from 'fs';
import * as path from 'path';

import { GATES, type GateName, type Element } from '../../../index';
import type {
  VideoAsset,
  Character,
  Location,
  Artifact,
} from '../../types';

// =============================================================================
// VIDEO TYPES
// =============================================================================

export type VideoStyle =
  | 'cinematic'
  | 'anime'
  | 'documentary'
  | 'dramatic'
  | 'ethereal'
  | 'action'
  | 'mysterious';

export type VideoFormat =
  | 'landscape'      // 16:9
  | 'portrait'       // 9:16 (TikTok, Reels)
  | 'square'         // 1:1
  | 'widescreen';    // 21:9

export type VideoDuration =
  | 'micro'          // 5-15 seconds
  | 'short'          // 15-60 seconds
  | 'medium'         // 1-3 minutes
  | 'long';          // 3-10 minutes

export interface VideoGenerationParams {
  title: string;
  description: string;
  style: VideoStyle;
  format: VideoFormat;
  duration: VideoDuration;
  gate?: GateName;
  element?: Element;
  music?: {
    style: string;
    tempo: 'slow' | 'medium' | 'fast';
    mood: string;
  };
  voiceover?: {
    enabled: boolean;
    voice: string;
    script?: string;
  };
}

export interface SceneShot {
  id: string;
  description: string;
  duration: number; // seconds
  cameraMovement: 'static' | 'pan' | 'zoom' | 'dolly' | 'orbit';
  transition: 'cut' | 'fade' | 'dissolve' | 'wipe';
  visualPrompt: string;
  audioNotes?: string;
}

export interface Storyboard {
  title: string;
  synopsis: string;
  style: VideoStyle;
  format: VideoFormat;
  totalDuration: number;
  shots: SceneShot[];
  musicDirection: string;
  voiceoverScript?: string;
}

// =============================================================================
// STYLE PRESETS
// =============================================================================

export const VIDEO_STYLE_PRESETS: Record<VideoStyle, {
  name: string;
  description: string;
  visualModifiers: string[];
  cameraStyle: string;
  pacing: string;
}> = {
  cinematic: {
    name: 'Cinematic',
    description: 'Epic, film-quality visuals with dramatic composition',
    visualModifiers: [
      'cinematic lighting',
      'dramatic composition',
      'film grain',
      'depth of field',
      'golden hour',
    ],
    cameraStyle: 'sweeping movements, dramatic angles',
    pacing: 'measured, building tension',
  },
  anime: {
    name: 'Anime',
    description: 'Japanese animation style with dynamic action',
    visualModifiers: [
      'anime style',
      'vibrant colors',
      'dynamic poses',
      'speed lines',
      'expressive characters',
    ],
    cameraStyle: 'dynamic cuts, reaction shots',
    pacing: 'energetic with emotional beats',
  },
  documentary: {
    name: 'Documentary',
    description: 'Educational, informative presentation style',
    visualModifiers: [
      'clean composition',
      'informative graphics',
      'archive footage style',
      'interview framing',
    ],
    cameraStyle: 'steady, observational',
    pacing: 'informative, contemplative',
  },
  dramatic: {
    name: 'Dramatic',
    description: 'Intense, emotionally charged visuals',
    visualModifiers: [
      'high contrast',
      'dramatic shadows',
      'intense expressions',
      'symbolic imagery',
    ],
    cameraStyle: 'close-ups, dutch angles',
    pacing: 'tension building, climactic',
  },
  ethereal: {
    name: 'Ethereal',
    description: 'Dreamlike, mystical atmosphere',
    visualModifiers: [
      'soft focus',
      'glowing elements',
      'floating particles',
      'otherworldly colors',
      'magical mist',
    ],
    cameraStyle: 'floating, gentle movements',
    pacing: 'slow, meditative',
  },
  action: {
    name: 'Action',
    description: 'Fast-paced, dynamic sequences',
    visualModifiers: [
      'motion blur',
      'impact frames',
      'dynamic angles',
      'explosive effects',
    ],
    cameraStyle: 'quick cuts, following action',
    pacing: 'rapid, intense',
  },
  mysterious: {
    name: 'Mysterious',
    description: 'Dark, intriguing atmosphere',
    visualModifiers: [
      'shadows',
      'fog',
      'silhouettes',
      'partial reveals',
      'noir lighting',
    ],
    cameraStyle: 'slow reveals, hidden details',
    pacing: 'suspenseful, enigmatic',
  },
};

// Gate-specific video modifiers
export const GATE_VIDEO_MODIFIERS: Record<GateName, {
  visualTheme: string[];
  soundscape: string;
  colorPalette: string;
}> = {
  foundation: {
    visualTheme: ['grounded shots', 'earth textures', 'stable composition'],
    soundscape: 'deep drums, earth rumbles',
    colorPalette: 'browns, greens, terracotta',
  },
  flow: {
    visualTheme: ['fluid motion', 'water effects', 'flowing transitions'],
    soundscape: 'flowing water, gentle waves',
    colorPalette: 'blues, silvers, aquamarine',
  },
  fire: {
    visualTheme: ['flames', 'dynamic energy', 'intense action'],
    soundscape: 'crackling fire, powerful drums',
    colorPalette: 'oranges, reds, gold',
  },
  heart: {
    visualTheme: ['soft focus', 'warm light', 'intimate framing'],
    soundscape: 'gentle strings, heartbeat rhythm',
    colorPalette: 'pinks, rose gold, warm white',
  },
  voice: {
    visualTheme: ['prismatic effects', 'sound visualization', 'expressive movement'],
    soundscape: 'harmonious vocals, resonant tones',
    colorPalette: 'rainbow spectrum, turquoise',
  },
  sight: {
    visualTheme: ['ethereal mist', 'distant vistas', 'visionary imagery'],
    soundscape: 'ethereal pads, distant echoes',
    colorPalette: 'pale blues, whites, lavender',
  },
  crown: {
    visualTheme: ['cosmic elements', 'void effects', 'transcendent visuals'],
    soundscape: 'cosmic ambience, deep frequencies',
    colorPalette: 'deep purples, blacks, silver',
  },
  shift: {
    visualTheme: ['transformation sequences', 'morphing elements', 'arcane symbols'],
    soundscape: 'shifting tones, magical sounds',
    colorPalette: 'shifting colors, aurora effects',
  },
  unity: {
    visualTheme: ['interconnected patterns', 'harmonious composition', 'balance'],
    soundscape: 'unified harmony, balanced tones',
    colorPalette: 'balanced spectrum, white light',
  },
  source: {
    visualTheme: ['pure light', 'divine radiance', 'ultimate power'],
    soundscape: 'transcendent frequencies, 1111 Hz undertones',
    colorPalette: 'golden white, pure light',
  },
};

// =============================================================================
// FILMMAKER CONFIGURATION
// =============================================================================

export interface FilmmakerConfig {
  provider: 'runway' | 'pika' | 'kling' | 'sora' | 'local';
  apiKey?: string;
  outputDir: string;
  defaultStyle: VideoStyle;
  defaultFormat: VideoFormat;
  defaultDuration: VideoDuration;
  watermark?: boolean;
}

const DEFAULT_CONFIG: FilmmakerConfig = {
  provider: 'runway',
  outputDir: path.join(process.env.HOME || process.env.USERPROFILE || '', '.arcanea', 'videos'),
  defaultStyle: 'cinematic',
  defaultFormat: 'landscape',
  defaultDuration: 'short',
  watermark: true,
};

// =============================================================================
// FILMMAKER CLASS
// =============================================================================

export class Filmmaker {
  private config: FilmmakerConfig;

  constructor(config: Partial<FilmmakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a character introduction video
   */
  async generateCharacterIntro(
    character: Partial<Character>,
    options?: Partial<VideoGenerationParams>
  ): Promise<{
    storyboard: Storyboard;
    prompt: string;
  }> {
    const style = options?.style || this.config.defaultStyle;
    const format = options?.format || this.config.defaultFormat;
    const duration = options?.duration || 'short';
    const gateModifiers = character.gate ? GATE_VIDEO_MODIFIERS[character.gate] : null;

    const shots: SceneShot[] = [
      {
        id: 'intro_1',
        description: `Establishing shot: ${character.name} in their environment`,
        duration: 3,
        cameraMovement: 'dolly',
        transition: 'fade',
        visualPrompt: this.buildCharacterVisualPrompt(character, 'establishing'),
      },
      {
        id: 'intro_2',
        description: `Close-up: ${character.name}'s face, eyes opening`,
        duration: 2,
        cameraMovement: 'zoom',
        transition: 'dissolve',
        visualPrompt: this.buildCharacterVisualPrompt(character, 'closeup'),
      },
      {
        id: 'intro_3',
        description: `Power reveal: ${character.element || 'magical'} energy manifesting`,
        duration: 3,
        cameraMovement: 'orbit',
        transition: 'cut',
        visualPrompt: this.buildCharacterVisualPrompt(character, 'power'),
      },
      {
        id: 'intro_4',
        description: `Hero shot: Full reveal with title card`,
        duration: 2,
        cameraMovement: 'static',
        transition: 'fade',
        visualPrompt: this.buildCharacterVisualPrompt(character, 'hero'),
      },
    ];

    const storyboard: Storyboard = {
      title: `${character.name} - Character Introduction`,
      synopsis: `Introducing ${character.name}${character.epithet ? `, "${character.epithet}"` : ''}, a ${character.species || 'mysterious being'} aligned with the ${character.gate || 'unknown'} gate.`,
      style,
      format,
      totalDuration: shots.reduce((sum, shot) => sum + shot.duration, 0),
      shots,
      musicDirection: gateModifiers?.soundscape || 'epic orchestral, building intensity',
      voiceoverScript: character.epithet
        ? `"${character.epithet}..." - ${character.name}`
        : undefined,
    };

    const prompt = this.buildVideoPrompt(storyboard, character.gate);

    return {
      storyboard,
      prompt,
    };
  }

  /**
   * Generate a location flyover video
   */
  async generateLocationFlyover(
    location: Partial<Location>,
    options?: Partial<VideoGenerationParams>
  ): Promise<{
    storyboard: Storyboard;
    prompt: string;
  }> {
    const style = options?.style || 'cinematic';
    const format = options?.format || this.config.defaultFormat;
    const gateModifiers = location.gate ? GATE_VIDEO_MODIFIERS[location.gate] : null;

    const shots: SceneShot[] = [
      {
        id: 'flyover_1',
        description: `Aerial approach to ${location.name}`,
        duration: 4,
        cameraMovement: 'dolly',
        transition: 'fade',
        visualPrompt: this.buildLocationVisualPrompt(location, 'aerial'),
      },
      {
        id: 'flyover_2',
        description: `Descending through clouds, revealing landscape`,
        duration: 3,
        cameraMovement: 'dolly',
        transition: 'dissolve',
        visualPrompt: this.buildLocationVisualPrompt(location, 'descent'),
      },
      {
        id: 'flyover_3',
        description: `Flying through the main area`,
        duration: 4,
        cameraMovement: 'pan',
        transition: 'cut',
        visualPrompt: this.buildLocationVisualPrompt(location, 'through'),
      },
      {
        id: 'flyover_4',
        description: `Final establishing shot with title`,
        duration: 3,
        cameraMovement: 'static',
        transition: 'fade',
        visualPrompt: this.buildLocationVisualPrompt(location, 'final'),
      },
    ];

    const storyboard: Storyboard = {
      title: `${location.name} - Location Flyover`,
      synopsis: `A cinematic journey through ${location.name}, a ${location.type || 'mysterious place'} with ${location.atmosphere || 'unique'} atmosphere.`,
      style,
      format,
      totalDuration: shots.reduce((sum, shot) => sum + shot.duration, 0),
      shots,
      musicDirection: gateModifiers?.soundscape || 'majestic orchestral, sense of wonder',
    };

    const prompt = this.buildVideoPrompt(storyboard, location.gate);

    return {
      storyboard,
      prompt,
    };
  }

  /**
   * Generate an artifact reveal video
   */
  async generateArtifactReveal(
    artifact: Partial<Artifact>,
    options?: Partial<VideoGenerationParams>
  ): Promise<{
    storyboard: Storyboard;
    prompt: string;
  }> {
    const style = options?.style || 'mysterious';
    const format = options?.format || this.config.defaultFormat;
    const gateModifiers = artifact.gate ? GATE_VIDEO_MODIFIERS[artifact.gate] : null;

    const shots: SceneShot[] = [
      {
        id: 'reveal_1',
        description: `Dark scene, hints of the artifact`,
        duration: 2,
        cameraMovement: 'static',
        transition: 'fade',
        visualPrompt: this.buildArtifactVisualPrompt(artifact, 'hidden'),
      },
      {
        id: 'reveal_2',
        description: `Light begins to emanate from the artifact`,
        duration: 2,
        cameraMovement: 'zoom',
        transition: 'dissolve',
        visualPrompt: this.buildArtifactVisualPrompt(artifact, 'awakening'),
      },
      {
        id: 'reveal_3',
        description: `Full reveal with power effects`,
        duration: 3,
        cameraMovement: 'orbit',
        transition: 'cut',
        visualPrompt: this.buildArtifactVisualPrompt(artifact, 'power'),
      },
      {
        id: 'reveal_4',
        description: `Detail shot showing intricacies`,
        duration: 2,
        cameraMovement: 'pan',
        transition: 'fade',
        visualPrompt: this.buildArtifactVisualPrompt(artifact, 'detail'),
      },
    ];

    const storyboard: Storyboard = {
      title: `${artifact.name} - Artifact Reveal`,
      synopsis: `The unveiling of ${artifact.name}, a ${artifact.powerLevel || 'powerful'} ${artifact.type || 'artifact'} imbued with ${artifact.element || 'mysterious'} energy.`,
      style,
      format,
      totalDuration: shots.reduce((sum, shot) => sum + shot.duration, 0),
      shots,
      musicDirection: gateModifiers?.soundscape || 'mysterious buildup, powerful reveal',
    };

    const prompt = this.buildVideoPrompt(storyboard, artifact.gate);

    return {
      storyboard,
      prompt,
    };
  }

  /**
   * Generate a promotional trailer
   */
  async generateTrailer(params: {
    project: {
      name: string;
      description: string;
      gate?: GateName;
      element?: Element;
    };
    characters?: Partial<Character>[];
    locations?: Partial<Location>[];
    artifacts?: Partial<Artifact>[];
    tagline?: string;
  }): Promise<{
    storyboard: Storyboard;
    prompt: string;
  }> {
    const shots: SceneShot[] = [];
    const gateModifiers = params.project.gate ? GATE_VIDEO_MODIFIERS[params.project.gate] : null;

    // Opening
    shots.push({
      id: 'trailer_open',
      description: 'Dramatic opening with world establishing shot',
      duration: 3,
      cameraMovement: 'dolly',
      transition: 'fade',
      visualPrompt: 'Epic fantasy landscape, sweeping vista, dramatic sky, cinematic',
    });

    // Characters
    if (params.characters?.length) {
      for (let i = 0; i < Math.min(params.characters.length, 3); i++) {
        const char = params.characters[i];
        shots.push({
          id: `trailer_char_${i}`,
          description: `Quick shot of ${char.name}`,
          duration: 1.5,
          cameraMovement: 'zoom',
          transition: 'cut',
          visualPrompt: this.buildCharacterVisualPrompt(char, 'hero'),
        });
      }
    }

    // Locations
    if (params.locations?.length) {
      for (let i = 0; i < Math.min(params.locations.length, 2); i++) {
        const loc = params.locations[i];
        shots.push({
          id: `trailer_loc_${i}`,
          description: `Vista of ${loc.name}`,
          duration: 2,
          cameraMovement: 'pan',
          transition: 'dissolve',
          visualPrompt: this.buildLocationVisualPrompt(loc, 'aerial'),
        });
      }
    }

    // Artifacts
    if (params.artifacts?.length) {
      shots.push({
        id: 'trailer_artifact',
        description: 'Artifact power moment',
        duration: 2,
        cameraMovement: 'orbit',
        transition: 'cut',
        visualPrompt: this.buildArtifactVisualPrompt(params.artifacts[0], 'power'),
      });
    }

    // Climax
    shots.push({
      id: 'trailer_climax',
      description: 'Action climax montage',
      duration: 3,
      cameraMovement: 'dolly',
      transition: 'cut',
      visualPrompt: 'Epic battle, magical powers, dramatic confrontation, cinematic action',
    });

    // Title card
    shots.push({
      id: 'trailer_title',
      description: `Title card: ${params.project.name}`,
      duration: 3,
      cameraMovement: 'static',
      transition: 'fade',
      visualPrompt: 'Dark background, title emerging from light, epic typography',
    });

    const storyboard: Storyboard = {
      title: `${params.project.name} - Official Trailer`,
      synopsis: params.project.description,
      style: 'cinematic',
      format: 'landscape',
      totalDuration: shots.reduce((sum, shot) => sum + shot.duration, 0),
      shots,
      musicDirection: gateModifiers?.soundscape || 'epic orchestral, building to crescendo',
      voiceoverScript: params.tagline,
    };

    const prompt = this.buildVideoPrompt(storyboard, params.project.gate);

    return {
      storyboard,
      prompt,
    };
  }

  /**
   * Generate short-form content (TikTok/Reels/Shorts)
   */
  async generateShortContent(params: {
    type: 'character-spotlight' | 'lore-drop' | 'art-showcase' | 'quote';
    entity: Partial<Character> | Partial<Location> | Partial<Artifact>;
    text?: string;
    hookLine?: string;
  }): Promise<{
    storyboard: Storyboard;
    prompt: string;
  }> {
    const shots: SceneShot[] = [];

    // Hook (first 3 seconds are crucial)
    shots.push({
      id: 'short_hook',
      description: params.hookLine || 'Attention-grabbing visual hook',
      duration: 2,
      cameraMovement: 'zoom',
      transition: 'cut',
      visualPrompt: 'Bold, eye-catching, immediate impact',
    });

    // Content
    shots.push({
      id: 'short_content',
      description: 'Main content showcase',
      duration: 8,
      cameraMovement: 'orbit',
      transition: 'dissolve',
      visualPrompt: 'Detailed showcase, engaging visuals',
    });

    // Call to action
    shots.push({
      id: 'short_cta',
      description: 'End card with call to action',
      duration: 2,
      cameraMovement: 'static',
      transition: 'fade',
      visualPrompt: 'Brand logo, follow prompt',
    });

    const entityName = 'name' in params.entity ? params.entity.name : 'Content';

    const storyboard: Storyboard = {
      title: `${entityName} - ${params.type}`,
      synopsis: params.text || `Short-form content featuring ${entityName}`,
      style: 'dramatic',
      format: 'portrait',
      totalDuration: 12,
      shots,
      musicDirection: 'Trending audio, upbeat, hook-worthy',
    };

    const prompt = this.buildVideoPrompt(storyboard);

    return {
      storyboard,
      prompt,
    };
  }

  /**
   * Get available style presets
   */
  getStylePresets(): typeof VIDEO_STYLE_PRESETS {
    return VIDEO_STYLE_PRESETS;
  }

  /**
   * Get gate video modifiers
   */
  getGateModifiers(): typeof GATE_VIDEO_MODIFIERS {
    return GATE_VIDEO_MODIFIERS;
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private buildCharacterVisualPrompt(
    character: Partial<Character>,
    shotType: 'establishing' | 'closeup' | 'power' | 'hero'
  ): string {
    const stylePreset = VIDEO_STYLE_PRESETS[this.config.defaultStyle];
    const gateModifiers = character.gate ? GATE_VIDEO_MODIFIERS[character.gate] : null;

    const elements: (string | null)[] = [];

    switch (shotType) {
      case 'establishing':
        elements.push(
          `${character.name} in their environment`,
          character.species ? `a ${character.species}` : null,
          'establishing shot',
          'environmental context',
        );
        break;
      case 'closeup':
        elements.push(
          `close-up of ${character.name}'s face`,
          character.appearance?.eyeColor ? `${character.appearance.eyeColor} eyes` : null,
          'detailed expression',
          'intimate framing',
        );
        break;
      case 'power':
        elements.push(
          `${character.name} activating powers`,
          character.element ? `${character.element} energy manifesting` : null,
          'magical effects',
          'power visualization',
        );
        break;
      case 'hero':
        elements.push(
          `hero shot of ${character.name}`,
          'full figure',
          'dramatic pose',
          character.appearance?.clothing ? `wearing ${character.appearance.clothing}` : null,
        );
        break;
    }

    // Add style modifiers
    elements.push(...stylePreset.visualModifiers);

    // Add gate-specific modifiers
    if (gateModifiers) {
      elements.push(...gateModifiers.visualTheme);
    }

    return elements.filter(Boolean).join(', ');
  }

  private buildLocationVisualPrompt(
    location: Partial<Location>,
    shotType: 'aerial' | 'descent' | 'through' | 'final'
  ): string {
    const stylePreset = VIDEO_STYLE_PRESETS[this.config.defaultStyle];
    const gateModifiers = location.gate ? GATE_VIDEO_MODIFIERS[location.gate] : null;

    const elements: (string | null)[] = [];

    switch (shotType) {
      case 'aerial':
        elements.push(
          `aerial view of ${location.name}`,
          location.type ? `${location.type}` : null,
          'bird\'s eye perspective',
          'vast scale',
        );
        break;
      case 'descent':
        elements.push(
          `descending towards ${location.name}`,
          'through clouds',
          'revealing landscape',
          'growing detail',
        );
        break;
      case 'through':
        elements.push(
          `flying through ${location.name}`,
          location.atmosphere ? `${location.atmosphere} atmosphere` : null,
          'immersive journey',
          'detailed environment',
        );
        break;
      case 'final':
        elements.push(
          `final vista of ${location.name}`,
          'establishing shot',
          'title card composition',
          'iconic framing',
        );
        break;
    }

    // Add location specifics
    if (location.geography?.terrain) {
      elements.push(`terrain: ${location.geography.terrain.join(', ')}`);
    }

    // Add style modifiers
    elements.push(...stylePreset.visualModifiers);

    // Add gate-specific modifiers
    if (gateModifiers) {
      elements.push(...gateModifiers.visualTheme);
    }

    return elements.filter(Boolean).join(', ');
  }

  private buildArtifactVisualPrompt(
    artifact: Partial<Artifact>,
    shotType: 'hidden' | 'awakening' | 'power' | 'detail'
  ): string {
    const stylePreset = VIDEO_STYLE_PRESETS[this.config.defaultStyle];
    const gateModifiers = artifact.gate ? GATE_VIDEO_MODIFIERS[artifact.gate] : null;

    const elements: (string | null)[] = [];

    switch (shotType) {
      case 'hidden':
        elements.push(
          `${artifact.name} partially hidden`,
          'shadows',
          'mystery',
          'anticipation',
        );
        break;
      case 'awakening':
        elements.push(
          `${artifact.name} beginning to glow`,
          artifact.element ? `${artifact.element} energy emerging` : null,
          'light effects',
          'magical awakening',
        );
        break;
      case 'power':
        elements.push(
          `${artifact.name} at full power`,
          artifact.powerLevel ? `${artifact.powerLevel} intensity` : null,
          'energy effects',
          'magical display',
        );
        break;
      case 'detail':
        elements.push(
          `detailed view of ${artifact.name}`,
          artifact.appearance ? artifact.appearance : null,
          'intricate details',
          'craftsmanship',
        );
        break;
    }

    // Add artifact type
    if (artifact.type) {
      elements.push(artifact.type);
    }

    // Add style modifiers
    elements.push(...stylePreset.visualModifiers);

    // Add gate-specific modifiers
    if (gateModifiers) {
      elements.push(...gateModifiers.visualTheme);
    }

    return elements.filter(Boolean).join(', ');
  }

  private buildVideoPrompt(storyboard: Storyboard, gate?: GateName): string {
    const stylePreset = VIDEO_STYLE_PRESETS[storyboard.style];
    const gateModifiers = gate ? GATE_VIDEO_MODIFIERS[gate] : null;

    const elements = [
      `VIDEO: ${storyboard.title}`,
      `STYLE: ${stylePreset.name} - ${stylePreset.description}`,
      `FORMAT: ${storyboard.format}`,
      `DURATION: ${storyboard.totalDuration} seconds`,
      '',
      'VISUAL DIRECTION:',
      ...stylePreset.visualModifiers.map(m => `- ${m}`),
      '',
      `CAMERA: ${stylePreset.cameraStyle}`,
      `PACING: ${stylePreset.pacing}`,
      '',
      'SHOTS:',
      ...storyboard.shots.map(shot =>
        `[${shot.id}] ${shot.duration}s - ${shot.cameraMovement} - ${shot.description}`
      ),
      '',
      `MUSIC: ${storyboard.musicDirection}`,
    ];

    if (gateModifiers) {
      elements.push(
        '',
        `GATE ALIGNMENT: ${gate}`,
        `Color Palette: ${gateModifiers.colorPalette}`,
        `Soundscape: ${gateModifiers.soundscape}`,
      );
    }

    if (storyboard.voiceoverScript) {
      elements.push('', `VOICEOVER: "${storyboard.voiceoverScript}"`);
    }

    return elements.join('\n');
  }

  private generateId(): string {
    return `vid_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export function createFilmmaker(config?: Partial<FilmmakerConfig>): Filmmaker {
  return new Filmmaker(config);
}

export default Filmmaker;
