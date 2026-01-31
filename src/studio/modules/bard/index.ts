/**
 * BARD Module - Audio Generation
 *
 * Generates audio content for worldbuilding including:
 * - Ambient soundscapes
 * - Character themes
 * - Location atmospheres
 * - Narrative voiceovers
 * - Music compositions
 * - Sound effects
 *
 * Integrates with Suno AI and other audio generation services.
 */

import * as fs from 'fs';
import * as path from 'path';

import { GATES, type GateName, type Element } from '../../../index';
import type {
  AudioAsset,
  Character,
  Location,
  Artifact,
} from '../../types';

// =============================================================================
// AUDIO TYPES
// =============================================================================

export type AudioType =
  | 'ambient'        // Background soundscapes
  | 'theme'          // Character/faction themes
  | 'score'          // Cinematic scores
  | 'narration'      // Voiceover narration
  | 'effect'         // Sound effects
  | 'meditation';    // Frequency-based meditations

export type MusicGenre =
  | 'orchestral'
  | 'electronic'
  | 'ambient'
  | 'epic'
  | 'mystical'
  | 'tribal'
  | 'ethereal'
  | 'dark'
  | 'heroic'
  | 'romantic';

export type AudioMood =
  | 'triumphant'
  | 'mysterious'
  | 'peaceful'
  | 'intense'
  | 'melancholic'
  | 'hopeful'
  | 'ominous'
  | 'playful'
  | 'spiritual'
  | 'dramatic';

export interface AudioGenerationParams {
  type: AudioType;
  title: string;
  description: string;
  genre: MusicGenre;
  mood: AudioMood;
  duration: number; // seconds
  gate?: GateName;
  element?: Element;
  tempo?: 'slow' | 'medium' | 'fast';
  instruments?: string[];
  vocals?: {
    enabled: boolean;
    style: 'spoken' | 'choral' | 'solo' | 'none';
    language?: string;
  };
}

export interface SunoPrompt {
  style: string;
  lyrics?: string;
  instrumental: boolean;
  tags: string[];
  title: string;
}

export interface SoundscapeLayer {
  id: string;
  name: string;
  type: 'base' | 'texture' | 'accent' | 'melodic';
  description: string;
  volume: number; // 0-1
  pan: number; // -1 to 1
  loop: boolean;
}

export interface Soundscape {
  title: string;
  description: string;
  mood: AudioMood;
  duration: number;
  layers: SoundscapeLayer[];
  sunoPrompt: SunoPrompt;
}

// =============================================================================
// GATE FREQUENCIES - The Solfeggio Scale
// =============================================================================

export const GATE_FREQUENCIES: Record<GateName, {
  frequency: number;
  solfeggioName: string;
  purpose: string;
  musicalNotes: string[];
  instruments: string[];
  soundscape: string;
}> = {
  foundation: {
    frequency: 174,
    solfeggioName: 'Foundation Frequency',
    purpose: 'Safety, physical grounding',
    musicalNotes: ['F2', 'C3', 'F3'],
    instruments: ['bass drums', 'didgeridoo', 'earth percussion', 'low strings'],
    soundscape: 'deep earth rumbles, heartbeat-like bass, grounding drums',
  },
  flow: {
    frequency: 285,
    solfeggioName: 'Healing Frequency',
    purpose: 'Healing, cellular energy',
    musicalNotes: ['C#3', 'G#3', 'C#4'],
    instruments: ['singing bowls', 'water sounds', 'flutes', 'harps'],
    soundscape: 'flowing water, gentle waves, rain, crystal bowls',
  },
  fire: {
    frequency: 396,
    solfeggioName: 'Liberation Frequency',
    purpose: 'Liberation from fear',
    musicalNotes: ['G3', 'D4', 'G4'],
    instruments: ['war drums', 'brass', 'electric guitar', 'taiko'],
    soundscape: 'crackling fire, powerful percussion, rising energy',
  },
  heart: {
    frequency: 417,
    solfeggioName: 'Change Frequency',
    purpose: 'Facilitating change',
    musicalNotes: ['G#3', 'D#4', 'G#4'],
    instruments: ['strings', 'piano', 'choir', 'warm synths'],
    soundscape: 'heartbeat rhythm, warm tones, emotional swells',
  },
  voice: {
    frequency: 528,
    solfeggioName: 'Miracle Frequency',
    purpose: 'Transformation, miracles',
    musicalNotes: ['C4', 'G4', 'C5'],
    instruments: ['voice', 'crystal instruments', 'harmonics', 'bells'],
    soundscape: 'pure tones, vocal harmonics, crystalline sounds',
  },
  sight: {
    frequency: 639,
    solfeggioName: 'Connection Frequency',
    purpose: 'Connection, relationships',
    musicalNotes: ['D#4', 'A#4', 'D#5'],
    instruments: ['ethereal pads', 'wind instruments', 'glass harmonica'],
    soundscape: 'wind through spaces, distant echoes, airy textures',
  },
  crown: {
    frequency: 741,
    solfeggioName: 'Awakening Frequency',
    purpose: 'Awakening intuition',
    musicalNotes: ['F#4', 'C#5', 'F#5'],
    instruments: ['tibetan bowls', 'cosmic synths', 'deep space sounds'],
    soundscape: 'void ambience, cosmic tones, transcendent frequencies',
  },
  shift: {
    frequency: 852,
    solfeggioName: 'Spiritual Order Frequency',
    purpose: 'Spiritual order, returning to source',
    musicalNotes: ['G#4', 'D#5', 'G#5'],
    instruments: ['morphing sounds', 'granular synthesis', 'shifting textures'],
    soundscape: 'transforming textures, arcane resonances, shifting realities',
  },
  unity: {
    frequency: 963,
    solfeggioName: 'Divine Consciousness Frequency',
    purpose: 'Divine consciousness, oneness',
    musicalNotes: ['B4', 'F#5', 'B5'],
    instruments: ['all instruments in harmony', 'unified choir', 'cosmic orchestra'],
    soundscape: 'harmonic convergence, unified tones, cosmic harmony',
  },
  source: {
    frequency: 1111,
    solfeggioName: 'Master Frequency',
    purpose: 'Gateway to source, ultimate alignment',
    musicalNotes: ['High harmonics', 'overtone series'],
    instruments: ['pure sine waves', 'angelic choir', 'light frequencies'],
    soundscape: 'pure light tones, transcendent frequencies, source connection',
  },
};

// =============================================================================
// MUSIC STYLE PRESETS
// =============================================================================

export const MUSIC_PRESETS: Record<MusicGenre, {
  name: string;
  description: string;
  tags: string[];
  instruments: string[];
  structure: string;
}> = {
  orchestral: {
    name: 'Orchestral',
    description: 'Full symphony orchestra, cinematic and grand',
    tags: ['orchestral', 'cinematic', 'film score', 'epic'],
    instruments: ['strings', 'brass', 'woodwinds', 'percussion', 'choir'],
    structure: 'Building movements, dramatic swells, quiet moments',
  },
  electronic: {
    name: 'Electronic',
    description: 'Synthesizers and electronic production',
    tags: ['electronic', 'synth', 'atmospheric', 'modern'],
    instruments: ['synthesizers', 'drum machines', 'electronic bass', 'pads'],
    structure: 'Layered builds, drops, textural evolution',
  },
  ambient: {
    name: 'Ambient',
    description: 'Atmospheric, immersive soundscapes',
    tags: ['ambient', 'atmospheric', 'drone', 'meditative'],
    instruments: ['pads', 'field recordings', 'processed sounds', 'drones'],
    structure: 'Slow evolution, long-form textures, minimal changes',
  },
  epic: {
    name: 'Epic',
    description: 'Grand, heroic, and powerful',
    tags: ['epic', 'trailer music', 'heroic', 'powerful'],
    instruments: ['full orchestra', 'choir', 'taiko', 'brass fanfares'],
    structure: 'Building intensity, climactic moments, triumphant resolution',
  },
  mystical: {
    name: 'Mystical',
    description: 'Magical, otherworldly, enchanting',
    tags: ['mystical', 'magical', 'fantasy', 'enchanting'],
    instruments: ['harps', 'bells', 'ethereal voices', 'unusual instruments'],
    structure: 'Floating, dreamlike, unexpected harmonies',
  },
  tribal: {
    name: 'Tribal',
    description: 'Primal, rhythmic, earth-connected',
    tags: ['tribal', 'world music', 'rhythmic', 'primal'],
    instruments: ['drums', 'chants', 'ethnic instruments', 'nature sounds'],
    structure: 'Polyrhythmic, building intensity, trance-inducing',
  },
  ethereal: {
    name: 'Ethereal',
    description: 'Heavenly, transcendent, spiritual',
    tags: ['ethereal', 'celestial', 'angelic', 'transcendent'],
    instruments: ['voices', 'strings', 'bells', 'reverb-laden instruments'],
    structure: 'Floating harmonies, slow movement, spacious',
  },
  dark: {
    name: 'Dark',
    description: 'Ominous, tension-filled, foreboding',
    tags: ['dark', 'ominous', 'tension', 'horror'],
    instruments: ['low brass', 'dissonant strings', 'industrial sounds'],
    structure: 'Building dread, sudden impacts, unsettling calm',
  },
  heroic: {
    name: 'Heroic',
    description: 'Brave, inspiring, adventurous',
    tags: ['heroic', 'adventure', 'inspiring', 'brave'],
    instruments: ['brass', 'strings', 'snare drums', 'horns'],
    structure: 'Noble themes, building momentum, triumphant peaks',
  },
  romantic: {
    name: 'Romantic',
    description: 'Emotional, beautiful, heartfelt',
    tags: ['romantic', 'emotional', 'beautiful', 'sentimental'],
    instruments: ['piano', 'strings', 'solo voice', 'harp'],
    structure: 'Emotional arcs, tender moments, passionate swells',
  },
};

// =============================================================================
// BARD CONFIGURATION
// =============================================================================

export interface BardConfig {
  provider: 'suno' | 'udio' | 'eleven' | 'local';
  apiKey?: string;
  outputDir: string;
  defaultGenre: MusicGenre;
  defaultMood: AudioMood;
  defaultDuration: number;
}

const DEFAULT_CONFIG: BardConfig = {
  provider: 'suno',
  outputDir: path.join(process.env.HOME || process.env.USERPROFILE || '', '.arcanea', 'audio'),
  defaultGenre: 'orchestral',
  defaultMood: 'mysterious',
  defaultDuration: 120,
};

// =============================================================================
// BARD CLASS
// =============================================================================

export class Bard {
  private config: BardConfig;

  constructor(config: Partial<BardConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a character theme
   */
  async generateCharacterTheme(
    character: Partial<Character>,
    options?: Partial<AudioGenerationParams>
  ): Promise<{
    soundscape: Soundscape;
    sunoPrompt: SunoPrompt;
  }> {
    const genre = options?.genre || this.config.defaultGenre;
    const mood = options?.mood || this.detectMoodFromCharacter(character);
    const gateFreq = character.gate ? GATE_FREQUENCIES[character.gate] : null;

    const layers: SoundscapeLayer[] = [
      {
        id: 'base_theme',
        name: 'Main Theme',
        type: 'melodic',
        description: `Core melodic theme for ${character.name}`,
        volume: 1,
        pan: 0,
        loop: true,
      },
      {
        id: 'elemental',
        name: 'Elemental Texture',
        type: 'texture',
        description: character.element
          ? `${character.element} elemental sounds`
          : 'Ambient texture',
        volume: 0.6,
        pan: 0,
        loop: true,
      },
      {
        id: 'gate_frequency',
        name: 'Gate Frequency',
        type: 'base',
        description: gateFreq
          ? `${gateFreq.frequency} Hz - ${gateFreq.purpose}`
          : 'Foundation tone',
        volume: 0.3,
        pan: 0,
        loop: true,
      },
    ];

    const sunoPrompt = this.buildCharacterSunoPrompt(character, genre, mood);

    const soundscape: Soundscape = {
      title: `${character.name} - Character Theme`,
      description: `Musical theme for ${character.name}${character.epithet ? `, "${character.epithet}"` : ''}`,
      mood,
      duration: options?.duration || this.config.defaultDuration,
      layers,
      sunoPrompt,
    };

    return {
      soundscape,
      sunoPrompt,
    };
  }

  /**
   * Generate a location ambient soundscape
   */
  async generateLocationAmbience(
    location: Partial<Location>,
    options?: Partial<AudioGenerationParams>
  ): Promise<{
    soundscape: Soundscape;
    sunoPrompt: SunoPrompt;
  }> {
    const genre = options?.genre || 'ambient';
    const mood = options?.mood || this.detectMoodFromLocation(location);
    const gateFreq = location.gate ? GATE_FREQUENCIES[location.gate] : null;

    const layers: SoundscapeLayer[] = [
      {
        id: 'environment',
        name: 'Environmental Base',
        type: 'base',
        description: `Core ambience of ${location.name}`,
        volume: 1,
        pan: 0,
        loop: true,
      },
      {
        id: 'atmosphere',
        name: 'Atmospheric Layer',
        type: 'texture',
        description: location.atmosphere
          ? `${location.atmosphere} atmosphere`
          : 'Ambient texture',
        volume: 0.7,
        pan: 0,
        loop: true,
      },
      {
        id: 'accents',
        name: 'Environmental Accents',
        type: 'accent',
        description: 'Occasional sounds and details',
        volume: 0.5,
        pan: 0,
        loop: false,
      },
    ];

    if (gateFreq) {
      layers.push({
        id: 'gate_undertone',
        name: 'Gate Undertone',
        type: 'base',
        description: `${gateFreq.frequency} Hz undertone`,
        volume: 0.2,
        pan: 0,
        loop: true,
      });
    }

    const sunoPrompt = this.buildLocationSunoPrompt(location, genre, mood);

    const soundscape: Soundscape = {
      title: `${location.name} - Ambient Soundscape`,
      description: `Environmental ambience for ${location.name}`,
      mood,
      duration: options?.duration || 300, // 5 minutes for ambience
      layers,
      sunoPrompt,
    };

    return {
      soundscape,
      sunoPrompt,
    };
  }

  /**
   * Generate a Gate meditation audio
   */
  async generateGateMeditation(
    gate: GateName,
    options?: {
      duration?: number;
      includeGuidance?: boolean;
      binauralBeats?: boolean;
    }
  ): Promise<{
    soundscape: Soundscape;
    sunoPrompt: SunoPrompt;
  }> {
    const gateFreq = GATE_FREQUENCIES[gate];
    const gateInfo = GATES[gate];

    const layers: SoundscapeLayer[] = [
      {
        id: 'carrier_tone',
        name: 'Carrier Frequency',
        type: 'base',
        description: `${gateFreq.frequency} Hz pure tone`,
        volume: 0.4,
        pan: 0,
        loop: true,
      },
      {
        id: 'harmonic_bed',
        name: 'Harmonic Bed',
        type: 'texture',
        description: `Harmonics of ${gateFreq.frequency} Hz`,
        volume: 0.5,
        pan: 0,
        loop: true,
      },
      {
        id: 'soundscape',
        name: 'Gate Soundscape',
        type: 'texture',
        description: gateFreq.soundscape,
        volume: 0.6,
        pan: 0,
        loop: true,
      },
    ];

    if (options?.binauralBeats) {
      layers.push({
        id: 'binaural_left',
        name: 'Binaural Left',
        type: 'base',
        description: `Left ear: ${gateFreq.frequency} Hz`,
        volume: 0.3,
        pan: -1,
        loop: true,
      });
      layers.push({
        id: 'binaural_right',
        name: 'Binaural Right',
        type: 'base',
        description: `Right ear: ${gateFreq.frequency + 10} Hz (10 Hz theta diff)`,
        volume: 0.3,
        pan: 1,
        loop: true,
      });
    }

    const sunoPrompt: SunoPrompt = {
      style: `meditation, ${gateFreq.solfeggioName}, healing frequencies, solfeggio`,
      instrumental: !options?.includeGuidance,
      tags: [
        'meditation',
        'healing',
        'solfeggio',
        `${gateFreq.frequency}hz`,
        gate,
        'frequency healing',
        'ambient',
        'relaxation',
      ],
      title: `${gate.charAt(0).toUpperCase() + gate.slice(1)} Gate Meditation - ${gateFreq.frequency} Hz`,
    };

    const soundscape: Soundscape = {
      title: `${gate.charAt(0).toUpperCase() + gate.slice(1)} Gate Meditation`,
      description: `${gateFreq.solfeggioName} (${gateFreq.frequency} Hz) - ${gateFreq.purpose}. Guardian: ${gateInfo.guardian}`,
      mood: 'spiritual',
      duration: options?.duration || 600, // 10 minutes default
      layers,
      sunoPrompt,
    };

    return {
      soundscape,
      sunoPrompt,
    };
  }

  /**
   * Generate an artifact power sound
   */
  async generateArtifactSound(
    artifact: Partial<Artifact>,
    options?: Partial<AudioGenerationParams>
  ): Promise<{
    soundscape: Soundscape;
    sunoPrompt: SunoPrompt;
  }> {
    const genre = options?.genre || 'mystical';
    const mood = options?.mood || 'mysterious';
    const gateFreq = artifact.gate ? GATE_FREQUENCIES[artifact.gate] : null;

    const layers: SoundscapeLayer[] = [
      {
        id: 'dormant',
        name: 'Dormant State',
        type: 'base',
        description: `${artifact.name} at rest`,
        volume: 0.5,
        pan: 0,
        loop: true,
      },
      {
        id: 'resonance',
        name: 'Power Resonance',
        type: 'texture',
        description: artifact.element
          ? `${artifact.element} energy resonance`
          : 'Magical resonance',
        volume: 0.7,
        pan: 0,
        loop: true,
      },
      {
        id: 'active',
        name: 'Active Power',
        type: 'accent',
        description: `${artifact.name} when activated`,
        volume: 1,
        pan: 0,
        loop: false,
      },
    ];

    const sunoPrompt: SunoPrompt = {
      style: `${genre}, magical artifact, power sound, fantasy, ${mood}`,
      instrumental: true,
      tags: [
        'fantasy',
        'magical',
        'artifact',
        artifact.type || 'relic',
        artifact.element || 'arcane',
        artifact.powerLevel || 'powerful',
      ],
      title: `${artifact.name} - Artifact Theme`,
    };

    const soundscape: Soundscape = {
      title: `${artifact.name} - Power Sound`,
      description: `Sound design for ${artifact.name}, a ${artifact.powerLevel || 'powerful'} ${artifact.type || 'artifact'}`,
      mood,
      duration: options?.duration || 60,
      layers,
      sunoPrompt,
    };

    return {
      soundscape,
      sunoPrompt,
    };
  }

  /**
   * Generate a narrative voiceover script
   */
  generateNarrationScript(params: {
    type: 'intro' | 'lore' | 'character' | 'location' | 'quest';
    subject: string;
    content: string;
    style: 'dramatic' | 'informative' | 'mysterious' | 'inspiring';
    gate?: GateName;
  }): {
    script: string;
    voiceDirection: string;
    musicSuggestion: string;
  } {
    const gateInfo = params.gate ? GATES[params.gate] : null;

    let voiceDirection = '';
    let musicSuggestion = '';

    switch (params.style) {
      case 'dramatic':
        voiceDirection = 'Deep, resonant voice. Building intensity. Pause for effect.';
        musicSuggestion = 'Epic orchestral, building tension';
        break;
      case 'informative':
        voiceDirection = 'Clear, authoritative voice. Measured pacing. Educational tone.';
        musicSuggestion = 'Subtle ambient, non-intrusive';
        break;
      case 'mysterious':
        voiceDirection = 'Whispering undertones. Enigmatic delivery. Lingering pauses.';
        musicSuggestion = 'Dark ambient, ethereal textures';
        break;
      case 'inspiring':
        voiceDirection = 'Warm, uplifting voice. Building hope. Emotional resonance.';
        musicSuggestion = 'Heroic orchestral, emotional strings';
        break;
    }

    if (gateInfo) {
      voiceDirection += ` Infuse with the energy of the ${params.gate} gate.`;
    }

    const script = this.formatNarrationScript(params.content, params.style);

    return {
      script,
      voiceDirection,
      musicSuggestion,
    };
  }

  /**
   * Get gate frequency information
   */
  getGateFrequency(gate: GateName): typeof GATE_FREQUENCIES[GateName] {
    return GATE_FREQUENCIES[gate];
  }

  /**
   * Get all gate frequencies
   */
  getAllGateFrequencies(): typeof GATE_FREQUENCIES {
    return GATE_FREQUENCIES;
  }

  /**
   * Get music presets
   */
  getMusicPresets(): typeof MUSIC_PRESETS {
    return MUSIC_PRESETS;
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private detectMoodFromCharacter(character: Partial<Character>): AudioMood {
    // Analyze character traits to determine musical mood
    const traits = character.personality?.traits || [];
    const element = character.element;

    if (traits.some(t => ['brave', 'heroic', 'courageous'].includes(t.toLowerCase()))) {
      return 'triumphant';
    }
    if (traits.some(t => ['mysterious', 'secretive', 'enigmatic'].includes(t.toLowerCase()))) {
      return 'mysterious';
    }
    if (traits.some(t => ['gentle', 'kind', 'peaceful'].includes(t.toLowerCase()))) {
      return 'peaceful';
    }
    if (traits.some(t => ['fierce', 'intense', 'passionate'].includes(t.toLowerCase()))) {
      return 'intense';
    }

    // Element-based mood
    switch (element) {
      case 'Fire': return 'intense';
      case 'Water': return 'peaceful';
      case 'Earth': return 'hopeful';
      case 'Wind': return 'playful';
      case 'Arcane': return 'mysterious';
      default: return 'mysterious';
    }
  }

  private detectMoodFromLocation(location: Partial<Location>): AudioMood {
    const atmosphere = location.atmosphere?.toLowerCase() || '';
    const type = location.type?.toLowerCase() || '';

    if (atmosphere.includes('peaceful') || atmosphere.includes('serene')) {
      return 'peaceful';
    }
    if (atmosphere.includes('dark') || atmosphere.includes('ominous')) {
      return 'ominous';
    }
    if (atmosphere.includes('mystical') || atmosphere.includes('magical')) {
      return 'mysterious';
    }
    if (type.includes('temple') || type.includes('sanctuary')) {
      return 'spiritual';
    }
    if (type.includes('battlefield') || type.includes('arena')) {
      return 'intense';
    }

    return 'mysterious';
  }

  private buildCharacterSunoPrompt(
    character: Partial<Character>,
    genre: MusicGenre,
    mood: AudioMood
  ): SunoPrompt {
    const preset = MUSIC_PRESETS[genre];
    const gateFreq = character.gate ? GATE_FREQUENCIES[character.gate] : null;

    const styleElements = [
      preset.name.toLowerCase(),
      mood,
      character.element ? `${character.element.toLowerCase()} energy` : null,
      gateFreq ? `${gateFreq.frequency}hz undertone` : null,
      'character theme',
      'fantasy',
    ].filter(Boolean);

    return {
      style: styleElements.join(', '),
      instrumental: true,
      tags: [
        ...preset.tags,
        'character theme',
        character.gate || 'fantasy',
        character.element?.toLowerCase() || 'magical',
        mood,
      ],
      title: `${character.name} Theme`,
    };
  }

  private buildLocationSunoPrompt(
    location: Partial<Location>,
    genre: MusicGenre,
    mood: AudioMood
  ): SunoPrompt {
    const preset = MUSIC_PRESETS[genre];
    const gateFreq = location.gate ? GATE_FREQUENCIES[location.gate] : null;

    const styleElements = [
      'ambient',
      'atmospheric',
      mood,
      location.atmosphere?.toLowerCase() || 'mysterious',
      location.type?.toLowerCase() || 'fantasy location',
      gateFreq ? `${gateFreq.frequency}hz` : null,
    ].filter(Boolean);

    return {
      style: styleElements.join(', '),
      instrumental: true,
      tags: [
        'ambient',
        'soundscape',
        'atmospheric',
        location.type || 'fantasy',
        mood,
        'environmental',
      ],
      title: `${location.name} Ambience`,
    };
  }

  private formatNarrationScript(content: string, style: string): string {
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);

    const formattedLines = lines.map(line => {
      // Add timing markers
      if (line.endsWith('.')) {
        return `${line} [pause 1s]`;
      }
      if (line.endsWith('...')) {
        return `${line} [pause 2s]`;
      }
      return line;
    });

    // Add intro/outro
    const intro = style === 'dramatic'
      ? '[fade in from silence, 2s]\n'
      : '[soft ambient begins]\n';

    const outro = '\n[pause 2s]\n[fade out, 3s]';

    return intro + formattedLines.join('\n') + outro;
  }

  private generateId(): string {
    return `aud_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export function createBard(config?: Partial<BardConfig>): Bard {
  return new Bard(config);
}

export default Bard;
