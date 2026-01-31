/**
 * SCRIBE Module - Text & Story Generation
 *
 * Generates worldbuilding content including:
 * - Characters with full profiles
 * - Locations with atmosphere
 * - Factions and organizations
 * - Artifacts and items
 * - Stories and narratives
 * - Canon-compliant validation
 */

import {
  GATES,
  GUARDIAN_WISDOM,
  type GateName,
  type Element,
} from '../../../index';

import type {
  Character,
  Location,
  Faction,
  Artifact,
  CharacterGenerationParams,
  LocationGenerationParams,
  ArtifactGenerationParams,
} from '../../types';

// =============================================================================
// SCRIBE CONFIGURATION
// =============================================================================

export interface ScribeConfig {
  model: 'claude' | 'gemini' | 'gpt';
  temperature: number;
  maxTokens: number;
  defaultGate: GateName;
  defaultElement: Element;
  enforceCanon: boolean;
}

const DEFAULT_CONFIG: ScribeConfig = {
  model: 'claude',
  temperature: 0.8,
  maxTokens: 4096,
  defaultGate: 'foundation',
  defaultElement: 'Arcane',
  enforceCanon: true,
};

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

const PROMPTS = {
  character: `You are a master worldbuilder creating a character for the Arcanea universe.

ARCANEA CONTEXT:
- Arcanea is a mythology-infused creative universe with Ten Gates of consciousness
- Each Gate has a Guardian, element, and frequency
- Characters align with Gates and elements
- The tone is elevated but accessible, mythic but practical

CHARACTER GENERATION PARAMETERS:
{{params}}

REQUIREMENTS:
1. Create a complete character profile
2. Align with the specified Gate ({{gate}}) and element ({{element}})
3. Include personality traits that reflect the Gate's energy
4. Create compelling background and motivations
5. Design abilities appropriate to their Gate level
6. Use the Arcanea naming conventions

OUTPUT FORMAT (JSON):
{
  "name": "Character name",
  "title": "Optional title",
  "epithet": "The [Descriptor]",
  "age": number or range,
  "gender": "...",
  "species": "Human/Elf/etc",
  "gate": "{{gate}}",
  "gatesOpened": number (1-10),
  "element": "{{element}}",
  "appearance": {
    "height": "...",
    "build": "...",
    "hairColor": "...",
    "hairStyle": "...",
    "eyeColor": "...",
    "skinTone": "...",
    "distinguishingFeatures": ["..."],
    "clothing": "..."
  },
  "personality": {
    "traits": ["trait1", "trait2", ...],
    "values": ["value1", "value2", ...],
    "fears": ["fear1", ...],
    "desires": ["desire1", ...],
    "quirks": ["quirk1", ...],
    "speechPattern": "Description of how they speak"
  },
  "background": {
    "birthplace": "...",
    "occupation": "...",
    "socialClass": "...",
    "education": "...",
    "history": "Detailed background story",
    "secrets": ["secret1", ...]
  },
  "abilities": {
    "skills": ["skill1", "skill2", ...],
    "powers": ["power1", ...],
    "weaknesses": ["weakness1", ...],
    "artifacts": ["artifact name if any"]
  },
  "portraitPrompt": "Detailed art prompt for generating this character's portrait"
}

Create a unique, compelling character now:`,

  location: `You are a master worldbuilder creating a location for the Arcanea universe.

ARCANEA CONTEXT:
- Arcanea has diverse realms aligned with elements and Gates
- Locations have atmosphere, history, and magical properties
- The world blends high fantasy with consciousness themes
- Each place reflects its aligned element and Gate energy

LOCATION GENERATION PARAMETERS:
{{params}}

REQUIREMENTS:
1. Create a vivid, immersive location
2. Align with the specified Gate ({{gate}}) and element ({{element}})
3. Include sensory details and atmosphere
4. Design interesting points of interest
5. Create a sense of history and mystery
6. Make it memorable and unique

OUTPUT FORMAT (JSON):
{
  "name": "Location name",
  "type": "realm/region/city/town/village/landmark/structure/wilderness/dungeon",
  "gate": "{{gate}}",
  "element": "{{element}}",
  "description": "Detailed description",
  "atmosphere": "The feeling and mood of the place",
  "history": "Brief history",
  "secrets": ["Hidden aspects"],
  "geography": {
    "terrain": ["terrain types"],
    "climate": "Climate description",
    "resources": ["Notable resources"],
    "hazards": ["Environmental dangers"]
  },
  "population": {
    "count": number or "sparse/moderate/dense",
    "demographics": ["Groups who live here"],
    "culture": "Cultural description",
    "government": "How it's ruled"
  },
  "pointsOfInterest": [
    {
      "name": "POI name",
      "description": "Description",
      "significance": "Why it matters"
    }
  ],
  "artPrompt": "Detailed art prompt for generating this location's visualization"
}

Create a vivid, memorable location now:`,

  artifact: `You are a master worldbuilder creating an artifact for the Arcanea universe.

ARCANEA CONTEXT:
- Artifacts in Arcanea are imbued with elemental and Gate energies
- They have histories, purposes, and sometimes sentience
- Power levels range from minor to mythic
- Artifacts often choose their wielders

ARTIFACT GENERATION PARAMETERS:
{{params}}

REQUIREMENTS:
1. Create a unique, compelling artifact
2. Align with the specified Gate ({{gate}}) and element ({{element}})
3. Design abilities appropriate to the power level ({{powerLevel}})
4. Include rich history and lore
5. Consider requirements for wielding
6. Make it feel like a legendary object

OUTPUT FORMAT (JSON):
{
  "name": "Artifact name",
  "type": "weapon/armor/accessory/tool/relic/consumable/vehicle",
  "gate": "{{gate}}",
  "element": "{{element}}",
  "powerLevel": "{{powerLevel}}",
  "description": "Overall description",
  "appearance": "Physical description",
  "history": "Origin story and notable events",
  "creator": "Who made it, if known",
  "abilities": [
    {
      "name": "Ability name",
      "description": "What it does",
      "activation": "How to use it",
      "cost": "What it costs to use"
    }
  ],
  "requirements": {
    "gateLevel": number or null,
    "element": "Required element affinity or null",
    "other": ["Other requirements"]
  },
  "artPrompt": "Detailed art prompt for generating this artifact's visualization"
}

Create a legendary artifact now:`,

  faction: `You are a master worldbuilder creating a faction for the Arcanea universe.

ARCANEA CONTEXT:
- Factions in Arcanea represent different philosophies and powers
- The Seven Houses are major political entities
- Guilds, orders, and cults pursue various goals
- Alliances and rivalries shape the world

FACTION GENERATION PARAMETERS:
{{params}}

REQUIREMENTS:
1. Create a compelling organization
2. Define clear goals and methods
3. Design interesting leadership structure
4. Create political relationships
5. Give them a distinct identity
6. Make them feel like real players in the world

OUTPUT FORMAT (JSON):
{
  "name": "Faction name",
  "type": "kingdom/guild/order/cult/tribe/corporation/family",
  "house": "Affiliated house if any",
  "gate": "Primary gate alignment",
  "element": "Primary element",
  "description": "What this faction is",
  "motto": "Their slogan or creed",
  "goals": ["Primary objectives"],
  "methods": ["How they achieve goals"],
  "leadership": {
    "type": "Structure type",
    "leader": "Current leader name",
    "hierarchy": ["Ranks from top to bottom"]
  },
  "allies": ["Allied factions"],
  "enemies": ["Enemy factions"],
  "neutrals": ["Neutral relations"],
  "symbolDescription": "Description of their symbol/emblem"
}

Create a memorable faction now:`,

  story: `You are a master storyteller writing for the Arcanea universe.

ARCANEA CONTEXT:
- Stories blend high fantasy with consciousness themes
- Characters face both external and internal challenges
- The Gates represent stages of growth and power
- Themes include creation, transformation, and unity

STORY PARAMETERS:
{{params}}

REQUIREMENTS:
1. Write in elevated but accessible prose
2. Include sensory details and atmosphere
3. Show character growth and change
4. Weave in Arcanean elements naturally
5. Create emotional resonance
6. Leave room for imagination

Write a compelling story now:`,
};

// =============================================================================
// SCRIBE CLASS
// =============================================================================

export class Scribe {
  private config: ScribeConfig;

  constructor(config: Partial<ScribeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a character
   */
  async generateCharacter(params: CharacterGenerationParams): Promise<{
    character: Partial<Character>;
    prompt: string;
    portraitPrompt: string;
  }> {
    const gate = params.gate || this.config.defaultGate;
    const element = params.element || this.config.defaultElement;
    const gateInfo = GATES[gate];

    const prompt = this.buildPrompt('character', {
      params: JSON.stringify(params, null, 2),
      gate,
      element,
      guardian: gateInfo.guardian,
      frequency: String(gateInfo.frequency),
    });

    // In production, this would call the AI model
    // For now, return a structured template
    const character: Partial<Character> = {
      name: params.name || 'Generated Character',
      gate,
      element,
      gatesOpened: Math.floor(Math.random() * 10) + 1,
      species: params.species || 'Human',
      personality: {
        traits: [],
        values: [],
        fears: [],
        desires: [],
      },
      background: {
        history: params.background || '',
      },
      abilities: {
        skills: [],
        powers: [],
        weaknesses: [],
      },
      relationships: [],
      galleryIds: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      character,
      prompt,
      portraitPrompt: this.generatePortraitPrompt(character),
    };
  }

  /**
   * Generate a location
   */
  async generateLocation(params: LocationGenerationParams): Promise<{
    location: Partial<Location>;
    prompt: string;
    artPrompt: string;
  }> {
    const gate = params.gate || this.config.defaultGate;
    const element = params.element || this.config.defaultElement;

    const prompt = this.buildPrompt('location', {
      params: JSON.stringify(params, null, 2),
      gate,
      element,
    });

    const location: Partial<Location> = {
      name: params.name || 'Generated Location',
      type: params.type || 'city',
      gate,
      element,
      description: '',
      atmosphere: params.atmosphere || '',
      artIds: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      location,
      prompt,
      artPrompt: this.generateLocationArtPrompt(location),
    };
  }

  /**
   * Generate an artifact
   */
  async generateArtifact(params: ArtifactGenerationParams): Promise<{
    artifact: Partial<Artifact>;
    prompt: string;
    artPrompt: string;
  }> {
    const gate = params.gate || this.config.defaultGate;
    const element = params.element || this.config.defaultElement;
    const powerLevel = params.powerLevel || 'moderate';

    const prompt = this.buildPrompt('artifact', {
      params: JSON.stringify(params, null, 2),
      gate,
      element,
      powerLevel,
    });

    const artifact: Partial<Artifact> = {
      name: params.name || 'Generated Artifact',
      type: params.type || 'relic',
      gate,
      element,
      powerLevel,
      description: '',
      appearance: '',
      abilities: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      artifact,
      prompt,
      artPrompt: this.generateArtifactArtPrompt(artifact),
    };
  }

  /**
   * Generate a faction
   */
  async generateFaction(params: {
    name?: string;
    type?: Faction['type'];
    concept?: string;
    gate?: GateName;
    element?: Element;
  }): Promise<{
    faction: Partial<Faction>;
    prompt: string;
  }> {
    const gate = params.gate || this.config.defaultGate;
    const element = params.element || this.config.defaultElement;

    const prompt = this.buildPrompt('faction', {
      params: JSON.stringify(params, null, 2),
      gate,
      element,
    });

    const faction: Partial<Faction> = {
      name: params.name || 'Generated Faction',
      type: params.type || 'guild',
      gate,
      element,
      description: '',
      goals: [],
      methods: [],
      leadership: {
        type: '',
      },
      allies: [],
      enemies: [],
      neutrals: [],
      membersIds: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      faction,
      prompt,
    };
  }

  /**
   * Generate a story or narrative
   */
  async generateStory(params: {
    title?: string;
    genre?: string;
    characters?: string[];
    setting?: string;
    theme?: string;
    length?: 'short' | 'medium' | 'long';
    gate?: GateName;
  }): Promise<{
    story: {
      title: string;
      content: string;
      wordCount: number;
    };
    prompt: string;
  }> {
    const prompt = this.buildPrompt('story', {
      params: JSON.stringify(params, null, 2),
    });

    return {
      story: {
        title: params.title || 'Untitled Story',
        content: '',
        wordCount: 0,
      },
      prompt,
    };
  }

  /**
   * Validate content against Arcanea canon
   */
  validateCanon(content: any): {
    valid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check gate frequencies
    if (content.gate && content.frequency) {
      const expectedFreq = GATES[content.gate as GateName]?.frequency;
      if (expectedFreq && content.frequency !== expectedFreq) {
        issues.push(`Frequency mismatch: ${content.gate} should be ${expectedFreq} Hz, not ${content.frequency} Hz`);
      }
    }

    // Check guardian names
    if (content.guardian) {
      const validGuardians = Object.values(GATES).map(g => g.guardian.toLowerCase());
      if (!validGuardians.includes(content.guardian.toLowerCase())) {
        issues.push(`Unknown guardian: ${content.guardian}`);
        suggestions.push(`Valid guardians: ${validGuardians.join(', ')}`);
      }
    }

    // Check element alignment
    if (content.element && content.gate) {
      const gateElement = GATES[content.gate as GateName]?.element;
      if (gateElement && content.element !== gateElement) {
        suggestions.push(`Note: ${content.gate} gate is aligned with ${gateElement}, but ${content.element} was used`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions,
    };
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private buildPrompt(template: keyof typeof PROMPTS, vars: Record<string, string>): string {
    let prompt = PROMPTS[template];
    for (const [key, value] of Object.entries(vars)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return prompt;
  }

  private generatePortraitPrompt(character: Partial<Character>): string {
    const gateInfo = character.gate ? GATES[character.gate] : null;

    const elements = [
      `Portrait of ${character.name || 'a character'}`,
      character.species ? `a ${character.species}` : null,
      character.appearance?.build ? `${character.appearance.build} build` : null,
      character.appearance?.hairColor ? `${character.appearance.hairColor} hair` : null,
      character.appearance?.hairStyle ? `in ${character.appearance.hairStyle} style` : null,
      character.appearance?.eyeColor ? `${character.appearance.eyeColor} eyes` : null,
      character.appearance?.clothing ? `wearing ${character.appearance.clothing}` : null,
      character.element ? `${character.element} elemental energy` : null,
      gateInfo ? `aligned with the ${character.gate} gate (${gateInfo.frequency} Hz)` : null,
      'Arcanea fantasy art style',
      'detailed character portrait',
      'dramatic lighting',
      'high quality',
    ].filter(Boolean);

    return elements.join(', ');
  }

  private generateLocationArtPrompt(location: Partial<Location>): string {
    const elements = [
      `${location.type || 'Location'}: ${location.name || 'Fantasy Place'}`,
      location.atmosphere ? `${location.atmosphere} atmosphere` : null,
      location.element ? `${location.element} elemental influence` : null,
      location.geography?.terrain ? `terrain: ${location.geography.terrain.join(', ')}` : null,
      location.geography?.climate ? `${location.geography.climate} climate` : null,
      'Arcanea fantasy art style',
      'wide landscape view',
      'epic scale',
      'atmospheric lighting',
      'highly detailed',
    ].filter(Boolean);

    return elements.join(', ');
  }

  private generateArtifactArtPrompt(artifact: Partial<Artifact>): string {
    const elements = [
      `${artifact.type || 'Artifact'}: ${artifact.name || 'Magical Item'}`,
      artifact.appearance ? artifact.appearance : null,
      artifact.element ? `${artifact.element} elemental energy` : null,
      artifact.powerLevel ? `${artifact.powerLevel} power level` : null,
      'Arcanea fantasy art style',
      'item showcase',
      'magical glow',
      'detailed texture',
      'dark background',
    ].filter(Boolean);

    return elements.join(', ');
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export function createScribe(config?: Partial<ScribeConfig>): Scribe {
  return new Scribe(config);
}

export { PROMPTS };
export default Scribe;
