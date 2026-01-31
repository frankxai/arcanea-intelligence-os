/**
 * Arcanea Worldbuilding Studio - Type Definitions
 *
 * Core types for the worldbuilding system including:
 * - Project structure
 * - Entity definitions
 * - Asset types
 * - Generation parameters
 */

import type { GateName, Element } from '../index';

// =============================================================================
// ASSET TYPES
// =============================================================================

export interface AssetBase {
  id: string;
  name: string;
  description: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ImageAsset extends AssetBase {
  type: 'image';
  filePath: string;
  url?: string;
  width: number;
  height: number;
  format: 'png' | 'jpg' | 'webp';
  style: ArtStyle;
  generator: string;
  prompt: string;
  seed?: number;
}

export interface VideoAsset extends AssetBase {
  type: 'video';
  filePath: string;
  url?: string;
  duration: number;
  width: number;
  height: number;
  format: 'mp4' | 'webm' | 'mov';
  fps: number;
  generator: string;
  prompt: string;
}

export interface AudioAsset extends AssetBase {
  type: 'audio';
  filePath: string;
  url?: string;
  duration: number;
  format: 'mp3' | 'wav' | 'ogg';
  sampleRate: number;
  generator: string;
  prompt: string;
}

export interface DocumentAsset extends AssetBase {
  type: 'document';
  filePath: string;
  content: string;
  format: 'md' | 'txt' | 'json';
}

export type Asset = ImageAsset | VideoAsset | AudioAsset | DocumentAsset;

// =============================================================================
// ART STYLES
// =============================================================================

export type ArtStyle =
  | 'arcanea-classic'      // Official Arcanea style
  | 'fantasy-painting'     // Traditional fantasy art
  | 'anime'                // Japanese anime style
  | 'realistic'            // Photorealistic
  | 'concept-art'          // Game/movie concept art
  | 'pixel-art'            // Retro pixel style
  | 'watercolor'           // Watercolor painting
  | 'oil-painting'         // Classical oil painting
  | 'digital-art'          // Modern digital illustration
  | 'comic'                // Comic book style
  | 'minimalist'           // Clean, minimal design
  | 'dark-fantasy'         // Gritty dark fantasy
  | 'ethereal'             // Soft, dreamy, magical
  | 'epic'                 // Grand, cinematic scale
  | 'portrait'             // Character portrait focus
  | 'landscape'            // Environment focus
  | 'action'               // Dynamic action scenes
  | 'custom';              // User-defined style

export interface StylePreset {
  name: string;
  style: ArtStyle;
  description: string;
  promptModifiers: string[];
  negativePrompt?: string;
  gate?: GateName;
  element?: Element;
}

// =============================================================================
// ENTITY DEFINITIONS
// =============================================================================

export interface Character {
  id: string;
  projectId: string;
  name: string;
  title?: string;
  epithet?: string;
  age?: number | string;
  gender?: string;
  species: string;
  race?: string;

  // Arcanea Integration
  gate: GateName;
  gatesOpened: number;
  element: Element;
  house?: string;
  guardian?: string;

  // Physical
  appearance: {
    height?: string;
    build?: string;
    hairColor?: string;
    hairStyle?: string;
    eyeColor?: string;
    skinTone?: string;
    distinguishingFeatures?: string[];
    clothing?: string;
  };

  // Personality
  personality: {
    traits: string[];
    values: string[];
    fears: string[];
    desires: string[];
    quirks?: string[];
    speechPattern?: string;
  };

  // Background
  background: {
    birthplace?: string;
    occupation?: string;
    socialClass?: string;
    education?: string;
    history: string;
    secrets?: string[];
  };

  // Abilities
  abilities: {
    skills: string[];
    powers?: string[];
    weaknesses?: string[];
    artifacts?: string[];
  };

  // Relationships
  relationships: CharacterRelationship[];

  // Assets
  portraitId?: string;
  galleryIds: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  notes?: string;
}

export interface CharacterRelationship {
  characterId: string;
  characterName: string;
  type: 'family' | 'friend' | 'rival' | 'enemy' | 'mentor' | 'student' | 'lover' | 'ally' | 'other';
  description: string;
}

export interface Location {
  id: string;
  projectId: string;
  name: string;
  type: 'realm' | 'region' | 'city' | 'town' | 'village' | 'landmark' | 'structure' | 'wilderness' | 'dungeon' | 'other';
  parentLocationId?: string;

  // Arcanea Integration
  gate?: GateName;
  element?: Element;
  house?: string;
  guardian?: string;

  // Description
  description: string;
  atmosphere: string;
  history?: string;
  secrets?: string[];

  // Physical
  geography?: {
    terrain: string[];
    climate?: string;
    resources?: string[];
    hazards?: string[];
  };

  // Population
  population?: {
    count?: number | string;
    demographics?: string[];
    culture?: string;
    government?: string;
  };

  // Points of Interest
  pointsOfInterest?: Array<{
    name: string;
    description: string;
    significance: string;
  }>;

  // Assets
  mapId?: string;
  artIds: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface Faction {
  id: string;
  projectId: string;
  name: string;
  type: 'kingdom' | 'guild' | 'order' | 'cult' | 'tribe' | 'corporation' | 'family' | 'other';

  // Arcanea Integration
  house?: string;
  gate?: GateName;
  element?: Element;

  // Description
  description: string;
  motto?: string;
  goals: string[];
  methods: string[];

  // Structure
  leadership: {
    type: string;
    leader?: string;
    hierarchy?: string[];
  };

  // Relations
  allies: string[];
  enemies: string[];
  neutrals: string[];

  // Assets
  symbolId?: string;
  membersIds: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface Artifact {
  id: string;
  projectId: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'tool' | 'relic' | 'consumable' | 'vehicle' | 'other';

  // Arcanea Integration
  gate?: GateName;
  element?: Element;
  powerLevel: 'minor' | 'moderate' | 'major' | 'legendary' | 'mythic';

  // Description
  description: string;
  appearance: string;
  history?: string;
  creator?: string;

  // Abilities
  abilities: Array<{
    name: string;
    description: string;
    activation?: string;
    cost?: string;
  }>;

  // Requirements
  requirements?: {
    gateLevel?: number;
    element?: Element;
    other?: string[];
  };

  // Current State
  currentOwnerId?: string;
  location?: string;

  // Assets
  imageId?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface MagicSystem {
  id: string;
  projectId: string;
  name: string;

  // Core Concept
  description: string;
  source: string;
  laws: string[];

  // Mechanics
  types: string[];
  ranks: string[];
  limitations: string[];
  costs: string[];

  // Learning
  requirements?: string[];
  training?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  name: string;
  description: string;
  date: string;
  era?: string;
  significance: 'minor' | 'moderate' | 'major' | 'world-changing';
  participants?: string[];
  locations?: string[];
  consequences?: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// PROJECT DEFINITION
// =============================================================================

export interface WorldProject {
  id: string;
  name: string;
  description: string;
  genre: string[];

  // Arcanea Integration
  gate: GateName;
  guardian: string;
  element: Element;

  // Core Settings
  settings: {
    technologyLevel: string;
    magicLevel: string;
    tone: string[];
    themes: string[];
  };

  // Entities (IDs)
  characterIds: string[];
  locationIds: string[];
  factionIds: string[];
  artifactIds: string[];
  magicSystemIds: string[];
  timelineEventIds: string[];

  // Assets (IDs)
  imageIds: string[];
  videoIds: string[];
  audioIds: string[];
  documentIds: string[];

  // Status
  status: 'draft' | 'active' | 'published' | 'archived';
  publishedAt?: Date;

  // Sync
  syncState: 'local' | 'synced' | 'pending' | 'conflict';
  cloudId?: string;
  lastSyncAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  version: number;
}

// =============================================================================
// GENERATION PARAMETERS
// =============================================================================

export interface CharacterGenerationParams {
  name?: string;
  concept?: string;
  gate?: GateName;
  element?: Element;
  species?: string;
  role?: string;
  personality?: string[];
  background?: string;
}

export interface LocationGenerationParams {
  name?: string;
  type?: Location['type'];
  concept?: string;
  gate?: GateName;
  element?: Element;
  atmosphere?: string;
  features?: string[];
}

export interface ArtifactGenerationParams {
  name?: string;
  type?: Artifact['type'];
  concept?: string;
  gate?: GateName;
  element?: Element;
  powerLevel?: Artifact['powerLevel'];
  purpose?: string;
}

export interface ImageGenerationParams {
  subject: string;
  style: ArtStyle;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  provider?: 'gemini' | 'dalle' | 'midjourney' | 'flux';
  negativePrompt?: string;
  seed?: number;
}

export interface VideoGenerationParams {
  concept: string;
  duration: 3 | 5 | 10 | 15;
  aspectRatio: '16:9' | '9:16' | '1:1';
  motion: 'subtle' | 'moderate' | 'dynamic';
  provider?: 'runway' | 'pika' | 'luma' | 'kling';
  sourceImage?: string;
}

export interface AudioGenerationParams {
  type: 'music' | 'voice' | 'ambience' | 'sfx';
  concept: string;
  duration?: number;
  provider?: 'suno' | 'elevenlabs' | 'udio' | 'mubert';
  voice?: string;
  style?: string;
}

// =============================================================================
// SOCIAL DISTRIBUTION
// =============================================================================

export type SocialPlatform =
  | 'twitter'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'farcaster'
  | 'linkedin'
  | 'threads';

export interface SocialPost {
  id: string;
  projectId: string;
  platform: SocialPlatform;
  content: {
    text: string;
    images?: string[];
    video?: string;
    audio?: string;
    hashtags?: string[];
    mentions?: string[];
  };
  scheduledAt?: Date;
  publishedAt?: Date;
  externalId?: string;
  externalUrl?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  analytics?: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
}

export interface SocialCampaign {
  id: string;
  projectId: string;
  name: string;
  description: string;
  platforms: SocialPlatform[];
  posts: SocialPost[];
  scheduledStart?: Date;
  status: 'draft' | 'active' | 'completed' | 'paused';
}

// =============================================================================
// EXPORTS
// =============================================================================

export type EntityType = 'character' | 'location' | 'faction' | 'artifact' | 'magic-system' | 'event';
export type AssetType = 'image' | 'video' | 'audio' | 'document';
