/**
 * Arcanea Infogenius - MCP Tools
 *
 * Visual generation tools for the Model Context Protocol.
 */

import { GeminiVisionService, createGeminiService, GateName, GATE_VISUAL_STYLES } from './gemini-service';

/**
 * MCP Tool definition
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

const GATE_NAMES = Object.keys(GATE_VISUAL_STYLES);

/**
 * Infogenius MCP Tools
 */
export const INFOGENIUS_TOOLS: MCPTool[] = [
  {
    name: 'infogenius_generate_infographic',
    description: 'Generate a Guardian-themed infographic on any topic with Arcanea visual styling',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The topic for the infographic (e.g., "The Ten Gates of Arcanea")',
        },
        gate: {
          type: 'string',
          enum: GATE_NAMES,
          description: 'Gate alignment for visual theming (e.g., "fire", "crown")',
        },
        dataPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'string' },
            },
          },
          description: 'Data points to visualize',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'infogenius_generate_portrait',
    description: 'Generate a character portrait or trading card with Gate and Element alignment',
    inputSchema: {
      type: 'object',
      properties: {
        characterName: {
          type: 'string',
          description: 'Name of the character',
        },
        gate: {
          type: 'string',
          enum: GATE_NAMES,
          description: 'Gate alignment',
        },
        element: {
          type: 'string',
          description: 'Primary element (Fire, Water, Earth, Wind, Void, Light, Arcane)',
        },
        abilities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Character abilities',
        },
        style: {
          type: 'string',
          enum: ['portrait', 'full', 'action'],
          description: 'Portrait style',
        },
      },
      required: ['characterName', 'gate', 'element'],
    },
  },
  {
    name: 'infogenius_generate_guardian',
    description: 'Generate an official Guardian portrait from Arcanea mythology',
    inputSchema: {
      type: 'object',
      properties: {
        guardian: {
          type: 'string',
          enum: Object.values(GATE_VISUAL_STYLES).map(s => s.guardian.toLowerCase()),
          description: 'Guardian name (e.g., "draconia", "shinkami")',
        },
        style: {
          type: 'string',
          enum: ['portrait', 'full', 'action', 'epic'],
          description: 'Portrait style',
        },
      },
      required: ['guardian'],
    },
  },
  {
    name: 'infogenius_generate_map',
    description: 'Generate a fantasy map of an Arcanean location',
    inputSchema: {
      type: 'object',
      properties: {
        locationName: {
          type: 'string',
          description: 'Name of the location',
        },
        locationType: {
          type: 'string',
          enum: ['city', 'realm', 'sanctuary', 'dungeon', 'landscape'],
          description: 'Type of location',
        },
        gate: {
          type: 'string',
          enum: GATE_NAMES,
          description: 'Gate alignment for visual theming',
        },
        style: {
          type: 'string',
          enum: ['illustrated', 'cartographic', 'satellite', 'mystical'],
          description: 'Map visual style',
        },
      },
      required: ['locationName', 'locationType'],
    },
  },
  {
    name: 'infogenius_generate_scroll',
    description: 'Generate an illuminated lore scroll with Arcanean styling',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Scroll title',
        },
        content: {
          type: 'string',
          description: 'Scroll content/text',
        },
        scrollType: {
          type: 'string',
          enum: ['prophecy', 'history', 'spell', 'teaching', 'chronicle'],
          description: 'Type of scroll',
        },
        gate: {
          type: 'string',
          enum: GATE_NAMES,
          description: 'Gate alignment',
        },
        illuminated: {
          type: 'boolean',
          description: 'Include illuminated borders',
        },
      },
      required: ['title', 'content', 'scrollType'],
    },
  },
];

/**
 * Tool handler type
 */
export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

/**
 * Create Infogenius tool handlers
 */
export function createInfogeniusHandlers(): Record<string, ToolHandler> {
  let geminiService: GeminiVisionService | null = null;

  const getService = (): GeminiVisionService => {
    if (!geminiService) {
      geminiService = createGeminiService();
    }
    return geminiService;
  };

  return {
    infogenius_generate_infographic: async (args: Record<string, unknown>) => {
      const topic = args.topic as string;
      const gate = (args.gate as GateName) || 'source';
      const dataPoints = (args.dataPoints as Array<{ label: string; value: string }>) || [];

      try {
        const service = getService();
        const result = await service.generateInfoGraphic(topic, dataPoints, gate);

        return {
          success: true,
          type: 'infographic',
          topic,
          gate,
          guardian: GATE_VISUAL_STYLES[gate].guardian,
          prompt: result.prompt,
          timestamp: result.timestamp.toISOString(),
          message: `Infographic prompt generated for "${topic}" with ${gate} Gate theming.`,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    },

    infogenius_generate_portrait: async (args: Record<string, unknown>) => {
      const characterName = args.characterName as string;
      const gate = args.gate as GateName;
      const element = args.element as string;
      const abilities = (args.abilities as string[]) || [];

      try {
        const service = getService();
        const result = await service.generateCharacterCard(characterName, gate, element, abilities);

        return {
          success: true,
          type: 'character_card',
          character: characterName,
          gate,
          element,
          abilities,
          guardian: GATE_VISUAL_STYLES[gate].guardian,
          prompt: result.prompt,
          timestamp: result.timestamp.toISOString(),
          message: `Character card prompt generated for "${characterName}" aligned with ${gate} Gate.`,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    },

    infogenius_generate_guardian: async (args: Record<string, unknown>) => {
      const guardianName = args.guardian as string;
      const style = (args.style as 'portrait' | 'full' | 'action') || 'portrait';

      try {
        const service = getService();
        const result = await service.generateGuardianPortrait(guardianName, style);

        return {
          success: true,
          type: 'guardian_portrait',
          guardian: guardianName,
          gate: result.gate,
          style,
          prompt: result.prompt,
          timestamp: result.timestamp.toISOString(),
          message: `Guardian portrait prompt generated for ${guardianName}.`,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    },

    infogenius_generate_map: async (args: Record<string, unknown>) => {
      const locationName = args.locationName as string;
      const locationType = args.locationType as 'city' | 'realm' | 'sanctuary' | 'dungeon' | 'landscape';
      const gate = args.gate as GateName | undefined;

      try {
        const service = getService();
        const result = await service.generateLocationMap(locationName, locationType, gate);

        return {
          success: true,
          type: 'location_map',
          location: locationName,
          locationType,
          gate: gate || 'source',
          prompt: result.prompt,
          timestamp: result.timestamp.toISOString(),
          message: `Location map prompt generated for "${locationName}".`,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    },

    infogenius_generate_scroll: async (args: Record<string, unknown>) => {
      const title = args.title as string;
      const content = args.content as string;
      const scrollType = args.scrollType as 'prophecy' | 'history' | 'spell' | 'teaching';
      const gate = args.gate as GateName | undefined;

      try {
        const service = getService();
        const result = await service.generateLoreScroll(title, content, scrollType, gate);

        return {
          success: true,
          type: 'lore_scroll',
          title,
          scrollType,
          gate: gate || 'source',
          prompt: result.prompt,
          timestamp: result.timestamp.toISOString(),
          message: `Lore scroll prompt generated for "${title}".`,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    },
  };
}
