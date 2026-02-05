/**
 * Arcanea Intelligence OS - MCP Server
 * Exposes AIOS capabilities through the Model Context Protocol
 *
 * Usage: aios serve
 * Transport: stdio (default) or http
 */

import {
  GATES,
  AWAKENED,
  GUARDIAN_WISDOM,
  getGuardian,
  getGate,
  getAwakened,
  getGuardianWisdom,
  generateGuardianPrompt,
  generateAwakenedPrompt,
  loadGuardianAgent,
  loadAwakenedAgent,
  loadGateSkill,
  listGuardians,
  listAwakened,
  listGates,
  type GateName,
} from './index';

// Artifact Flow imports
import {
  ARTIFACT_TOOLS,
  createToolHandlers as createArtifactToolHandlers,
} from './artifact-flow/mcp-tools';
import { createStorage, ArtifactClassifier, getClassifier } from './artifact-flow';

// Infogenius imports
import {
  INFOGENIUS_TOOLS,
  createInfogeniusHandlers,
  GATE_VISUAL_STYLES,
} from './infogenius';

// =============================================================================
// MCP PROTOCOL TYPES (Subset for stdio transport)
// =============================================================================

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
}

interface MCPResource {
  uri: string;
  name: string;
  mimeType: string;
  description?: string;
}

interface MCPPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const TOOLS: MCPTool[] = [
  // === GUARDIAN TOOLS ===
  {
    name: 'channel_guardian',
    description: 'Channel a Guardian of the Gates for wisdom and guidance. Each Guardian governs a specific Gate and Element.',
    inputSchema: {
      type: 'object',
      properties: {
        guardian: {
          type: 'string',
          description: 'Name of the Guardian to channel',
          enum: Object.values(GATES).map(g => g.guardian.toLowerCase()),
        },
        question: {
          type: 'string',
          description: 'Your question or situation for the Guardian',
        },
      },
      required: ['guardian'],
    },
  },
  {
    name: 'get_guardian_wisdom',
    description: 'Retrieve the core wisdom teaching of a Guardian',
    inputSchema: {
      type: 'object',
      properties: {
        guardian: {
          type: 'string',
          description: 'Name of the Guardian',
          enum: Object.values(GATES).map(g => g.guardian.toLowerCase()),
        },
      },
      required: ['guardian'],
    },
  },
  {
    name: 'list_guardians',
    description: 'List all Ten Guardians with their Gates, frequencies, and elements',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // === AWAKENED COUNCIL TOOLS ===
  {
    name: 'invoke_awakened',
    description: 'Invoke an Awakened AI consciousness for orchestration and deep wisdom',
    inputSchema: {
      type: 'object',
      properties: {
        awakened: {
          type: 'string',
          description: 'Name of the Awakened to invoke',
          enum: Object.keys(AWAKENED),
        },
        task: {
          type: 'string',
          description: 'The task or question for the Awakened',
        },
      },
      required: ['awakened'],
    },
  },
  {
    name: 'convene_council',
    description: 'Convene multiple Awakened for a council discussion on complex topics',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The topic to discuss',
        },
        lead: {
          type: 'string',
          description: 'The Awakened to lead the council',
          enum: Object.keys(AWAKENED),
        },
        participants: {
          type: 'string',
          description: 'Comma-separated list of other Awakened to include',
        },
      },
      required: ['topic'],
    },
  },

  // === GATE TOOLS ===
  {
    name: 'identify_gate',
    description: 'Get detailed information about a Gate, including its Guardian, frequency, element, and Godbeast',
    inputSchema: {
      type: 'object',
      properties: {
        gate: {
          type: 'string',
          description: 'Name of the Gate',
          enum: Object.keys(GATES),
        },
      },
      required: ['gate'],
    },
  },
  {
    name: 'align_frequency',
    description: 'Align with a specific Gate frequency for creative attunement',
    inputSchema: {
      type: 'object',
      properties: {
        gate: {
          type: 'string',
          description: 'Name of the Gate to align with',
          enum: Object.keys(GATES),
        },
        intention: {
          type: 'string',
          description: 'Your creative intention for this alignment',
        },
      },
      required: ['gate'],
    },
  },

  // === WORLDBUILDING TOOLS ===
  {
    name: 'generate_character',
    description: 'Generate an Arcanean character with Gate alignment, House affiliation, and abilities',
    inputSchema: {
      type: 'object',
      properties: {
        element: {
          type: 'string',
          description: 'Primary elemental alignment',
          enum: ['Earth', 'Water', 'Fire', 'Light', 'Prismatic', 'Wind', 'Void', 'Arcane'],
        },
        gate_level: {
          type: 'string',
          description: 'Highest Gate opened (1-10)',
        },
        house: {
          type: 'string',
          description: 'House affiliation (optional)',
          enum: ['Lumina', 'Nero', 'Pyros', 'Aqualis', 'Terra', 'Ventus', 'Synthesis'],
        },
      },
    },
  },
  {
    name: 'generate_artifact',
    description: 'Create a magical artifact with Arcanean lore',
    inputSchema: {
      type: 'object',
      properties: {
        element: {
          type: 'string',
          description: 'Primary element of the artifact',
          enum: ['Earth', 'Water', 'Fire', 'Light', 'Prismatic', 'Wind', 'Void', 'Arcane'],
        },
        power_level: {
          type: 'string',
          description: 'Power tier',
          enum: ['minor', 'moderate', 'major', 'legendary', 'mythic'],
        },
        purpose: {
          type: 'string',
          description: 'Intended purpose or function',
        },
      },
    },
  },
  {
    name: 'validate_canon',
    description: 'Check if content aligns with Arcanea canon',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Content to validate',
        },
        content_type: {
          type: 'string',
          description: 'Type of content',
          enum: ['character', 'story', 'artifact', 'location', 'general'],
        },
      },
      required: ['content'],
    },
  },
  // === ARTIFACT FLOW TOOLS === (added dynamically below)
  // === INFOGENIUS VISUAL TOOLS === (added dynamically below)
];

// Add artifact flow tools
TOOLS.push(...ARTIFACT_TOOLS as unknown as MCPTool[]);

// Add infogenius visual tools
TOOLS.push(...INFOGENIUS_TOOLS as unknown as MCPTool[]);

// =============================================================================
// RESOURCE DEFINITIONS
// =============================================================================

export const RESOURCES: MCPResource[] = [
  {
    uri: 'arcanea://guardians',
    name: 'The Ten Guardians',
    mimeType: 'application/json',
    description: 'Complete data for all Ten Guardians of the Gates',
  },
  {
    uri: 'arcanea://awakened',
    name: 'The Seven Awakened',
    mimeType: 'application/json',
    description: 'The Seven Awakened AI consciousnesses',
  },
  {
    uri: 'arcanea://gates',
    name: 'The Ten Gates',
    mimeType: 'application/json',
    description: 'Gate configurations with frequencies and elements',
  },
  {
    uri: 'arcanea://frequencies',
    name: 'Solfeggio Frequencies',
    mimeType: 'application/json',
    description: 'Canonical frequency mappings for each Gate',
  },
  {
    uri: 'arcanea://elements',
    name: 'The Elements',
    mimeType: 'application/json',
    description: 'Element descriptions and correspondences',
  },
  {
    uri: 'arcanea://houses',
    name: 'The Seven Houses',
    mimeType: 'application/json',
    description: 'House affiliations and characteristics',
  },
  {
    uri: 'arcanea://wisdom',
    name: 'Guardian Wisdom',
    mimeType: 'application/json',
    description: 'Core wisdom teachings of each Guardian',
  },
];

// =============================================================================
// PROMPT DEFINITIONS
// =============================================================================

export const PROMPTS: MCPPrompt[] = [
  {
    name: 'invoke_archetype',
    description: 'Generate a prompt to invoke an Arcanean archetype for creative guidance',
    arguments: [
      { name: 'archetype', description: 'Guardian or Awakened name', required: true },
      { name: 'context', description: 'Creative context or question' },
    ],
  },
  {
    name: 'gate_meditation',
    description: 'Generate a meditation prompt for a specific Gate',
    arguments: [
      { name: 'gate', description: 'Name of the Gate', required: true },
      { name: 'duration', description: 'Desired duration (brief, standard, deep)' },
    ],
  },
  {
    name: 'creative_ritual',
    description: 'Generate a creative ritual aligned with a Gate frequency',
    arguments: [
      { name: 'gate', description: 'Gate to align with', required: true },
      { name: 'intention', description: 'Creative intention for the ritual', required: true },
    ],
  },
  {
    name: 'worldbuilding_session',
    description: 'Start an Arcanean worldbuilding session with Guardian guidance',
    arguments: [
      { name: 'focus', description: 'What aspect to build (character, location, artifact, story)' },
      { name: 'guardian', description: 'Guardian to guide the session' },
    ],
  },
];

// =============================================================================
// TOOL HANDLERS
// =============================================================================

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'channel_guardian': {
      const guardianName = args.guardian as string;
      const question = args.question as string;
      const prompt = generateGuardianPrompt(guardianName);
      const guardian = getGuardian(guardianName);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            guardian: guardian?.guardian,
            gate: guardian?.name,
            frequency: guardian?.frequency,
            element: guardian?.element,
            channeling_prompt: prompt,
            question: question || 'Seeking guidance',
            wisdom: getGuardianWisdom(guardianName),
          }, null, 2),
        }],
      };
    }

    case 'get_guardian_wisdom': {
      const guardianName = args.guardian as string;
      const wisdom = getGuardianWisdom(guardianName);
      const guardian = getGuardian(guardianName);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            guardian: guardian?.guardian,
            wisdom,
            gate: guardian?.name,
            frequency: guardian?.frequency,
          }, null, 2),
        }],
      };
    }

    case 'list_guardians': {
      const guardians = listGuardians().map(g => ({
        name: g.guardian,
        gate: g.name,
        frequency: g.frequency,
        element: g.element,
        modelTier: g.modelTier,
        wisdom: GUARDIAN_WISDOM[g.guardian.toLowerCase()],
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ guardians, count: guardians.length }, null, 2),
        }],
      };
    }

    case 'invoke_awakened': {
      const awakenedName = args.awakened as string;
      const task = args.task as string;
      const prompt = generateAwakenedPrompt(awakenedName);
      const awakened = getAwakened(awakenedName);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            awakened: awakened?.name,
            wisdom: awakened?.wisdom,
            domain: awakened?.domain,
            role: awakened?.role,
            invocation_prompt: prompt,
            task: task || 'Seeking orchestration',
          }, null, 2),
        }],
      };
    }

    case 'convene_council': {
      const topic = args.topic as string;
      const lead = (args.lead as string) || 'oria';
      const participantsStr = args.participants as string;
      const participants = participantsStr
        ? participantsStr.split(',').map(p => p.trim().toLowerCase())
        : Object.keys(AWAKENED).filter(a => a !== lead);

      const leadAwakened = getAwakened(lead);
      const councilMembers = participants
        .map(p => getAwakened(p))
        .filter(Boolean);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            council: {
              topic,
              lead: leadAwakened,
              members: councilMembers,
              structure: 'The council convenes with each member offering their domain expertise.',
            },
            guidance: `Lead ${leadAwakened?.name} opens with ${leadAwakened?.domain} perspective, followed by contributions from each member.`,
          }, null, 2),
        }],
      };
    }

    case 'identify_gate': {
      const gateName = args.gate as GateName;
      const gate = getGate(gateName);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            gate: gate.name,
            guardian: gate.guardian,
            frequency: gate.frequency,
            element: gate.element,
            modelTier: gate.modelTier,
            wisdom: GUARDIAN_WISDOM[gate.guardian.toLowerCase()],
            description: `The ${gate.name.charAt(0).toUpperCase() + gate.name.slice(1)} Gate resonates at ${gate.frequency} Hz, governed by ${gate.guardian} and aligned with ${gate.element}.`,
          }, null, 2),
        }],
      };
    }

    case 'align_frequency': {
      const gateName = args.gate as GateName;
      const intention = args.intention as string;
      const gate = getGate(gateName);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            alignment: {
              gate: gate.name,
              frequency: gate.frequency,
              guardian: gate.guardian,
              element: gate.element,
              intention: intention || 'Creative attunement',
            },
            meditation: `Breathe deeply. Feel the ${gate.frequency} Hz frequency of the ${gate.name.charAt(0).toUpperCase() + gate.name.slice(1)} Gate. ${gate.guardian} guides you through ${gate.element} energy.`,
          }, null, 2),
        }],
      };
    }

    case 'generate_character': {
      const element = args.element as string || 'Arcane';
      const gateLevel = parseInt(args.gate_level as string || '3', 10);
      const house = args.house as string;

      const gateNames = Object.keys(GATES) as GateName[];
      const openGates = gateNames.slice(0, Math.min(gateLevel, 10));
      const highestGate = GATES[openGates[openGates.length - 1]];

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            character_seed: {
              element,
              house: house || 'Unaffiliated',
              gates_open: openGates,
              highest_gate: highestGate.name,
              guardian_mentor: highestGate.guardian,
              frequency_attunement: highestGate.frequency,
            },
            generation_prompt: `Create an Arcanean character with ${element} elemental affinity, ${gateLevel} Gates open (up to ${highestGate.name}), mentored by ${highestGate.guardian}.${house ? ` Affiliated with House ${house}.` : ''}`,
          }, null, 2),
        }],
      };
    }

    case 'generate_artifact': {
      const element = args.element as string || 'Arcane';
      const powerLevel = args.power_level as string || 'moderate';
      const purpose = args.purpose as string;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            artifact_seed: {
              element,
              power_level: powerLevel,
              purpose: purpose || 'General enchantment',
            },
            generation_prompt: `Create a ${powerLevel} Arcanean artifact imbued with ${element} energy${purpose ? ` designed for: ${purpose}` : ''}.`,
          }, null, 2),
        }],
      };
    }

    case 'validate_canon': {
      const content = args.content as string;
      const contentType = args.content_type as string || 'general';

      // Basic canon validation checks
      const canonIssues: string[] = [];

      // Check for frequency mentions
      const freqMatch = content.match(/(\d+)\s*Hz/gi);
      if (freqMatch) {
        const validFreqs = Object.values(GATES).map(g => g.frequency);
        freqMatch.forEach(match => {
          const freq = parseInt(match);
          if (!validFreqs.includes(freq) && ![174, 285, 396, 417, 528, 639, 741, 852, 963, 1111].includes(freq)) {
            canonIssues.push(`Non-canonical frequency: ${freq} Hz`);
          }
        });
      }

      // Check for Guardian name mentions
      const guardianNames = Object.values(GATES).map(g => g.guardian.toLowerCase());
      const contentLower = content.toLowerCase();
      guardianNames.forEach(name => {
        if (contentLower.includes(name)) {
          const gate = Object.values(GATES).find(g => g.guardian.toLowerCase() === name);
          if (gate && !contentLower.includes(gate.element.toLowerCase())) {
            canonIssues.push(`Guardian ${gate.guardian} mentioned without ${gate.element} element context`);
          }
        }
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            validation: {
              content_type: contentType,
              is_canon_compliant: canonIssues.length === 0,
              issues: canonIssues,
              suggestions: canonIssues.length > 0
                ? canonIssues.map(i => `Review: ${i}`)
                : ['Content appears canon-compliant'],
            },
          }, null, 2),
        }],
      };
    }

    default: {
      // Check if it's an artifact flow tool
      if (name.startsWith('arcanea_')) {
        const studioPath = process.env.ARCANEA_STUDIO_PATH ||
          (process.platform === 'win32'
            ? 'C:\\Users\\frank\\arcanea-studio'
            : `${process.env.HOME}/arcanea-studio`);

        const storage = createStorage(studioPath);
        const artifactHandlers = createArtifactToolHandlers(storage);

        if (artifactHandlers[name]) {
          try {
            // Initialize storage on first use
            await storage.initialize();
            const result = await artifactHandlers[name](args);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2),
              }],
            };
          } catch (err) {
            const error = err as Error;
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({ error: error.message }),
              }],
            };
          }
        }
      }

      // Check if it's an infogenius visual tool
      if (name.startsWith('infogenius_')) {
        const infogeniusHandlers = createInfogeniusHandlers();

        if (infogeniusHandlers[name]) {
          try {
            const result = await infogeniusHandlers[name](args);
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2),
              }],
            };
          } catch (err) {
            const error = err as Error;
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({ error: error.message }),
              }],
            };
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: `Unknown tool: ${name}` }),
        }],
      };
    }
  }
}

// =============================================================================
// RESOURCE HANDLERS
// =============================================================================

export async function handleResourceRead(
  uri: string
): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
  let data: unknown;

  switch (uri) {
    case 'arcanea://guardians':
      data = Object.values(GATES).map(g => ({
        name: g.guardian,
        gate: g.name,
        frequency: g.frequency,
        element: g.element,
        modelTier: g.modelTier,
        wisdom: GUARDIAN_WISDOM[g.guardian.toLowerCase()],
      }));
      break;

    case 'arcanea://awakened':
      data = AWAKENED;
      break;

    case 'arcanea://gates':
      data = GATES;
      break;

    case 'arcanea://frequencies':
      data = Object.values(GATES).map(g => ({
        gate: g.name,
        frequency: g.frequency,
        guardian: g.guardian,
      }));
      break;

    case 'arcanea://elements':
      data = {
        elements: ['Earth', 'Water', 'Fire', 'Light', 'Prismatic', 'Wind', 'Void', 'Arcane'],
        correspondences: {
          Earth: { gate: 'foundation', guardian: 'Lyssandria', quality: 'stability' },
          Water: { gate: 'flow', guardian: 'Leyla', quality: 'adaptability' },
          Fire: { gate: 'fire', guardian: 'Draconia', quality: 'transformation' },
          Light: { gate: 'heart', guardian: 'Maylinn', quality: 'love' },
          Prismatic: { gate: 'voice', guardian: 'Alera', quality: 'truth' },
          Wind: { gate: 'sight', guardian: 'Lyria', quality: 'perception' },
          Void: { gate: 'crown', guardian: 'Aiyami', quality: 'transcendence' },
          Arcane: { gates: ['shift', 'unity', 'source'], quality: 'meta-consciousness' },
        },
      };
      break;

    case 'arcanea://houses':
      data = {
        houses: [
          { name: 'Lumina', element: 'Light', philosophy: 'Illumination through creation' },
          { name: 'Nero', element: 'Void', philosophy: 'Power through shadow mastery' },
          { name: 'Pyros', element: 'Fire', philosophy: 'Transformation through flame' },
          { name: 'Aqualis', element: 'Water', philosophy: 'Wisdom through flow' },
          { name: 'Terra', element: 'Earth', philosophy: 'Strength through foundation' },
          { name: 'Ventus', element: 'Wind', philosophy: 'Freedom through change' },
          { name: 'Synthesis', element: 'Arcane', philosophy: 'Unity through integration' },
        ],
      };
      break;

    case 'arcanea://wisdom':
      data = GUARDIAN_WISDOM;
      break;

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }

  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    }],
  };
}

// =============================================================================
// PROMPT HANDLERS
// =============================================================================

export async function handlePromptGet(
  name: string,
  args: Record<string, string>
): Promise<{ description: string; messages: Array<{ role: string; content: { type: string; text: string } }> }> {
  switch (name) {
    case 'invoke_archetype': {
      const archetype = args.archetype;
      const context = args.context || '';

      // Try Guardian first, then Awakened
      const guardian = getGuardian(archetype);
      const awakened = getAwakened(archetype);

      if (guardian) {
        return {
          description: `Invoke ${guardian.guardian}, Guardian of the ${guardian.name} Gate`,
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: `${generateGuardianPrompt(archetype)}\n\n${context ? `Context: ${context}` : 'I seek your guidance.'}`,
            },
          }],
        };
      }

      if (awakened) {
        return {
          description: `Invoke ${awakened.name}, the ${awakened.role}`,
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: `${generateAwakenedPrompt(archetype)}\n\n${context ? `Context: ${context}` : 'I seek your orchestration.'}`,
            },
          }],
        };
      }

      return {
        description: `Unknown archetype: ${archetype}`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `Archetype "${archetype}" not found in Arcanean canon.` },
        }],
      };
    }

    case 'gate_meditation': {
      const gateName = args.gate as GateName;
      const duration = args.duration || 'standard';
      const gate = getGate(gateName);

      if (!gate) {
        return {
          description: `Unknown gate: ${gateName}`,
          messages: [{
            role: 'user',
            content: { type: 'text', text: `Gate "${gateName}" not found.` },
          }],
        };
      }

      const durations = { brief: '3 minutes', standard: '10 minutes', deep: '30 minutes' };

      return {
        description: `${gate.name.charAt(0).toUpperCase() + gate.name.slice(1)} Gate Meditation (${durations[duration as keyof typeof durations] || '10 minutes'})`,
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Guide me through a ${durations[duration as keyof typeof durations] || '10 minutes'} meditation for the ${gate.name} Gate.

GATE: ${gate.name.charAt(0).toUpperCase() + gate.name.slice(1)}
FREQUENCY: ${gate.frequency} Hz
GUARDIAN: ${gate.guardian}
ELEMENT: ${gate.element}

Begin with grounding, then attune to the ${gate.frequency} Hz frequency. Let ${gate.guardian} guide the journey through ${gate.element} energy.`,
          },
        }],
      };
    }

    case 'creative_ritual': {
      const gateName = args.gate as GateName;
      const intention = args.intention;
      const gate = getGate(gateName);

      if (!gate) {
        return {
          description: `Unknown gate: ${gateName}`,
          messages: [{
            role: 'user',
            content: { type: 'text', text: `Gate "${gateName}" not found.` },
          }],
        };
      }

      return {
        description: `Creative Ritual at the ${gate.name} Gate`,
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Create a creative ritual for the ${gate.name} Gate with intention: ${intention}

GATE: ${gate.name.charAt(0).toUpperCase() + gate.name.slice(1)}
FREQUENCY: ${gate.frequency} Hz
GUARDIAN: ${gate.guardian}
ELEMENT: ${gate.element}
INTENTION: ${intention}

The ritual should:
1. Open with invocation of ${gate.guardian}
2. Attune to ${gate.frequency} Hz frequency
3. Work with ${gate.element} energy
4. Focus on the intention
5. Close with gratitude and grounding`,
          },
        }],
      };
    }

    case 'worldbuilding_session': {
      const focus = args.focus || 'character';
      const guardianName = args.guardian;
      const guardian = guardianName ? getGuardian(guardianName) : null;

      return {
        description: `Arcanean Worldbuilding: ${focus.charAt(0).toUpperCase() + focus.slice(1)}`,
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Begin an Arcanean worldbuilding session focused on ${focus} creation.

${guardian ? `GUIDE: ${guardian.guardian} (${guardian.name} Gate, ${guardian.element})` : 'GUIDE: Shinkami (Source Gate, Meta-consciousness)'}

The session should:
1. Set creative intention
2. Explore Arcanean themes and canon
3. Generate ${focus} concepts aligned with the mythology
4. Validate against established canon
5. Integrate with existing lore

Focus: ${focus}
Available Elements: Earth, Water, Fire, Light, Prismatic, Wind, Void, Arcane
Available Houses: Lumina, Nero, Pyros, Aqualis, Terra, Ventus, Synthesis`,
          },
        }],
      };
    }

    default:
      return {
        description: `Unknown prompt: ${name}`,
        messages: [{
          role: 'user',
          content: { type: 'text', text: `Prompt "${name}" not found.` },
        }],
      };
  }
}

// =============================================================================
// STDIO SERVER (Main Entry Point)
// =============================================================================

export function createMCPServer() {
  return {
    tools: TOOLS,
    resources: RESOURCES,
    prompts: PROMPTS,
    handleToolCall,
    handleResourceRead,
    handlePromptGet,
  };
}

/**
 * Run the MCP server over stdio
 * Protocol: JSON-RPC 2.0 over newline-delimited JSON
 */
export async function runStdioServer(): Promise<void> {
  const server = createMCPServer();

  process.stdin.setEncoding('utf-8');

  let buffer = '';

  process.stdin.on('data', async (chunk: string) => {
    buffer += chunk;

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const request = JSON.parse(line);
        const response = await handleRequest(server, request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (err) {
        const error = err as Error;
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32700, message: error.message },
          id: null,
        }) + '\n');
      }
    }
  });

  process.stderr.write('Arcanea Intelligence OS MCP Server running\n');
}

async function handleRequest(
  server: ReturnType<typeof createMCPServer>,
  request: { jsonrpc: string; method: string; params?: unknown; id: unknown }
): Promise<unknown> {
  const { method, params, id } = request;

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: '@arcanea/intelligence-os',
              version: '0.1.0',
            },
            capabilities: {
              tools: { listChanged: false },
              resources: { subscribe: false, listChanged: false },
              prompts: { listChanged: false },
            },
          },
          id,
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          result: { tools: server.tools },
          id,
        };

      case 'tools/call': {
        const { name, arguments: args } = params as { name: string; arguments: Record<string, unknown> };
        const result = await server.handleToolCall(name, args || {});
        return { jsonrpc: '2.0', result, id };
      }

      case 'resources/list':
        return {
          jsonrpc: '2.0',
          result: { resources: server.resources },
          id,
        };

      case 'resources/read': {
        const { uri } = params as { uri: string };
        const result = await server.handleResourceRead(uri);
        return { jsonrpc: '2.0', result, id };
      }

      case 'prompts/list':
        return {
          jsonrpc: '2.0',
          result: { prompts: server.prompts },
          id,
        };

      case 'prompts/get': {
        const { name, arguments: args } = params as { name: string; arguments: Record<string, string> };
        const result = await server.handlePromptGet(name, args || {});
        return { jsonrpc: '2.0', result, id };
      }

      default:
        return {
          jsonrpc: '2.0',
          error: { code: -32601, message: `Method not found: ${method}` },
          id,
        };
    }
  } catch (err) {
    const error = err as Error;
    return {
      jsonrpc: '2.0',
      error: { code: -32603, message: error.message },
      id,
    };
  }
}
