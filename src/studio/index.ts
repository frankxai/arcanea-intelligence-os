/**
 * Arcanea Worldbuilding Studio
 *
 * A comprehensive creative suite for worldbuilding including:
 * - SCRIBE: Text & story generation
 * - PAINTER: Image generation
 * - FILMMAKER: Video generation
 * - BARD: Audio generation
 * - Project management
 * - Social distribution
 *
 * "In the Studio, worlds are born. Through creation, we become creators."
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export * from './types';

// =============================================================================
// MODULE EXPORTS
// =============================================================================

// Scribe - Text Generation
export { Scribe, createScribe, PROMPTS as SCRIBE_PROMPTS } from './modules/scribe';
export type { ScribeConfig } from './modules/scribe';

// Painter - Image Generation
export {
  Painter,
  createPainter,
  STYLE_PRESETS,
  GATE_STYLE_MODIFIERS,
} from './modules/painter';
export type { PainterConfig } from './modules/painter';

// Filmmaker - Video Generation
export {
  Filmmaker,
  createFilmmaker,
  VIDEO_STYLE_PRESETS,
  GATE_VIDEO_MODIFIERS,
} from './modules/filmmaker';
export type {
  FilmmakerConfig,
  VideoStyle,
  VideoFormat,
  VideoDuration,
  Storyboard,
  SceneShot,
} from './modules/filmmaker';

// Bard - Audio Generation
export {
  Bard,
  createBard,
  GATE_FREQUENCIES,
  MUSIC_PRESETS,
} from './modules/bard';
export type {
  BardConfig,
  AudioType,
  MusicGenre,
  AudioMood,
  Soundscape,
  SunoPrompt,
} from './modules/bard';

// Social Launcher
export {
  SocialLauncher,
  createSocialLauncher,
  ContentFormatter,
  PLATFORM_CONFIGS,
} from './distribution/social';
export type { SocialLauncherConfig, PlatformConfig } from './distribution/social';

// =============================================================================
// STUDIO CLASS
// =============================================================================

import { Scribe, createScribe, ScribeConfig } from './modules/scribe';
import { Painter, createPainter, PainterConfig } from './modules/painter';
import { Filmmaker, createFilmmaker, FilmmakerConfig } from './modules/filmmaker';
import { Bard, createBard, BardConfig } from './modules/bard';
import { SocialLauncher, createSocialLauncher, SocialLauncherConfig } from './distribution/social';
import type {
  WorldProject,
  Character,
  Location,
  Faction,
  Artifact,
  ImageAsset,
  ArtStyle,
  SocialPlatform,
  SocialPost,
} from './types';

export interface StudioConfig {
  scribe?: Partial<ScribeConfig>;
  painter?: Partial<PainterConfig>;
  filmmaker?: Partial<FilmmakerConfig>;
  bard?: Partial<BardConfig>;
  social?: Partial<SocialLauncherConfig>;
  projectDir?: string;
}

/**
 * Main Worldbuilding Studio class
 * Orchestrates all creative modules
 */
export class WorldbuildingStudio {
  public scribe: Scribe;
  public painter: Painter;
  public filmmaker: Filmmaker;
  public bard: Bard;
  public social: SocialLauncher;

  private projectDir: string;
  private currentProject: WorldProject | null = null;

  constructor(config: StudioConfig = {}) {
    this.scribe = createScribe(config.scribe);
    this.painter = createPainter(config.painter);
    this.filmmaker = createFilmmaker(config.filmmaker);
    this.bard = createBard(config.bard);
    this.social = createSocialLauncher(config.social);

    this.projectDir = config.projectDir || process.cwd();
  }

  // ==========================================================================
  // PROJECT MANAGEMENT
  // ==========================================================================

  /**
   * Create a new world project
   */
  createProject(params: {
    name: string;
    description: string;
    genre: string[];
    gate: import('../index').GateName;
    guardian: string;
    element: import('../index').Element;
  }): WorldProject {
    const now = new Date();

    const project: WorldProject = {
      id: this.generateId('proj'),
      name: params.name,
      description: params.description,
      genre: params.genre,
      gate: params.gate,
      guardian: params.guardian,
      element: params.element,
      settings: {
        technologyLevel: 'medieval-fantasy',
        magicLevel: 'high',
        tone: ['epic', 'mystical'],
        themes: ['transformation', 'consciousness', 'creation'],
      },
      characterIds: [],
      locationIds: [],
      factionIds: [],
      artifactIds: [],
      magicSystemIds: [],
      timelineEventIds: [],
      imageIds: [],
      videoIds: [],
      audioIds: [],
      documentIds: [],
      status: 'draft',
      syncState: 'local',
      createdAt: now,
      updatedAt: now,
      tags: [],
      version: 1,
    };

    this.currentProject = project;
    return project;
  }

  /**
   * Set the current active project
   */
  setProject(project: WorldProject): void {
    this.currentProject = project;
  }

  /**
   * Get the current project
   */
  getProject(): WorldProject | null {
    return this.currentProject;
  }

  // ==========================================================================
  // CREATION WORKFLOWS
  // ==========================================================================

  /**
   * Create a character with portrait
   */
  async createCharacter(params: import('./types').CharacterGenerationParams): Promise<{
    character: Partial<Character>;
    portrait: { prompt: string };
  }> {
    // Generate character data
    const { character, portraitPrompt } = await this.scribe.generateCharacter(params);

    // Generate portrait
    const portrait = await this.painter.generatePortrait(character);

    return {
      character,
      portrait,
    };
  }

  /**
   * Create a location with art
   */
  async createLocation(params: import('./types').LocationGenerationParams): Promise<{
    location: Partial<Location>;
    art: { prompt: string };
  }> {
    // Generate location data
    const { location, artPrompt } = await this.scribe.generateLocation(params);

    // Generate art
    const art = await this.painter.generateLocationArt(location);

    return {
      location,
      art,
    };
  }

  /**
   * Create an artifact with render
   */
  async createArtifact(params: import('./types').ArtifactGenerationParams): Promise<{
    artifact: Partial<Artifact>;
    render: { prompt: string };
  }> {
    // Generate artifact data
    const { artifact, artPrompt } = await this.scribe.generateArtifact(params);

    // Generate render
    const render = await this.painter.generateArtifactRender(artifact);

    return {
      artifact,
      render,
    };
  }

  // ==========================================================================
  // PUBLISHING WORKFLOWS
  // ==========================================================================

  /**
   * Publish character to social media
   */
  async publishCharacter(
    character: Partial<Character>,
    platforms: SocialPlatform[],
    options?: {
      customText?: string;
      imageUrl?: string;
    }
  ): Promise<SocialPost[]> {
    const text = options?.customText || this.generateCharacterPost(character);
    const hashtags = ['Arcanea', 'WorldBuilding', 'CharacterDesign', 'Fantasy', 'OC'];

    if (character.gate) {
      hashtags.push(`${character.gate}Gate`);
    }
    if (character.element) {
      hashtags.push(`${character.element}Element`);
    }

    return this.social.createCrossPost(
      platforms,
      {
        text,
        images: options?.imageUrl ? [options.imageUrl] : undefined,
        hashtags,
      },
      this.currentProject?.id || 'default'
    );
  }

  /**
   * Publish location to social media
   */
  async publishLocation(
    location: Partial<Location>,
    platforms: SocialPlatform[],
    options?: {
      customText?: string;
      imageUrl?: string;
    }
  ): Promise<SocialPost[]> {
    const text = options?.customText || this.generateLocationPost(location);
    const hashtags = ['Arcanea', 'WorldBuilding', 'FantasyLocation', 'ConceptArt'];

    if (location.gate) {
      hashtags.push(`${location.gate}Gate`);
    }

    return this.social.createCrossPost(
      platforms,
      {
        text,
        images: options?.imageUrl ? [options.imageUrl] : undefined,
        hashtags,
      },
      this.currentProject?.id || 'default'
    );
  }

  /**
   * Launch a full creation campaign
   */
  async launchCampaign(params: {
    name: string;
    entities: Array<{
      type: 'character' | 'location' | 'artifact';
      entity: Partial<Character> | Partial<Location> | Partial<Artifact>;
      imageUrl?: string;
    }>;
    platforms: SocialPlatform[];
    scheduledStart?: Date;
    interval?: number; // minutes between posts
  }): Promise<{
    campaignId: string;
    posts: SocialPost[];
  }> {
    const posts: SocialPost[] = [];

    for (const item of params.entities) {
      let text: string;
      let hashtags: string[];

      if (item.type === 'character') {
        text = this.generateCharacterPost(item.entity as Partial<Character>);
        hashtags = ['Arcanea', 'CharacterDesign', 'OC'];
      } else if (item.type === 'location') {
        text = this.generateLocationPost(item.entity as Partial<Location>);
        hashtags = ['Arcanea', 'WorldBuilding', 'FantasyLocation'];
      } else {
        text = this.generateArtifactPost(item.entity as Partial<Artifact>);
        hashtags = ['Arcanea', 'MagicItems', 'Fantasy'];
      }

      const entityPosts = this.social.createCrossPost(
        params.platforms,
        {
          text,
          images: item.imageUrl ? [item.imageUrl] : undefined,
          hashtags,
        },
        this.currentProject?.id || 'default'
      );

      posts.push(...entityPosts);
    }

    return {
      campaignId: this.generateId('camp'),
      posts,
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private generateCharacterPost(character: Partial<Character>): string {
    const lines = [
      `✨ ${character.name}${character.epithet ? ` "${character.epithet}"` : ''}`,
      '',
    ];

    if (character.species) {
      lines.push(`Species: ${character.species}`);
    }
    if (character.gate) {
      lines.push(`Gate: ${character.gate.charAt(0).toUpperCase() + character.gate.slice(1)}`);
    }
    if (character.element) {
      lines.push(`Element: ${character.element}`);
    }

    if (character.personality?.traits?.length) {
      lines.push('');
      lines.push(`Traits: ${character.personality.traits.slice(0, 3).join(', ')}`);
    }

    lines.push('');
    lines.push('Built with Arcanea Worldbuilding Studio');

    return lines.join('\n');
  }

  private generateLocationPost(location: Partial<Location>): string {
    const lines = [
      `🏰 ${location.name}`,
      '',
    ];

    if (location.type) {
      lines.push(`Type: ${location.type}`);
    }
    if (location.atmosphere) {
      lines.push(`Atmosphere: ${location.atmosphere}`);
    }
    if (location.gate) {
      lines.push(`Gate: ${location.gate.charAt(0).toUpperCase() + location.gate.slice(1)}`);
    }

    lines.push('');
    lines.push('Built with Arcanea Worldbuilding Studio');

    return lines.join('\n');
  }

  private generateArtifactPost(artifact: Partial<Artifact>): string {
    const lines = [
      `⚔️ ${artifact.name}`,
      '',
    ];

    if (artifact.type) {
      lines.push(`Type: ${artifact.type}`);
    }
    if (artifact.powerLevel) {
      lines.push(`Power: ${artifact.powerLevel}`);
    }
    if (artifact.element) {
      lines.push(`Element: ${artifact.element}`);
    }

    lines.push('');
    lines.push('Built with Arcanea Worldbuilding Studio');

    return lines.join('\n');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createStudio(config?: StudioConfig): WorldbuildingStudio {
  return new WorldbuildingStudio(config);
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default WorldbuildingStudio;
