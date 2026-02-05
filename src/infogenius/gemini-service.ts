/**
 * Arcanea Infogenius - Gemini Vision Service
 *
 * Integration with Google's Gemini 2.5 Flash Image (Nano Banana)
 * for Guardian-aligned visual generation.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

/**
 * Gate visual style definitions
 */
export const GATE_VISUAL_STYLES = {
  foundation: {
    guardian: 'Lyssandria',
    frequency: '396 Hz',
    colors: ['#8B4513', '#2F4F4F', '#DAA520', '#654321'],
    artisticStyle: 'Ancient carved stone, earth textures, crystalline formations',
    motifs: ['mountains', 'roots', 'crystals', 'ancient runes', 'foundation stones'],
    lighting: 'Deep amber glow from within earth, shadow play',
    atmosphere: 'Grounded, stable, primordial strength',
  },
  flow: {
    guardian: 'Leyla',
    frequency: '417 Hz',
    colors: ['#4169E1', '#00CED1', '#7B68EE', '#E0FFFF'],
    artisticStyle: 'Fluid watercolor, flowing gradients, liquid mercury',
    motifs: ['waves', 'spirals', 'water drops', 'moon phases', 'flowing fabric'],
    lighting: 'Moonlit shimmer, bioluminescent glow',
    atmosphere: 'Fluid, adaptive, emotionally resonant',
  },
  fire: {
    guardian: 'Draconia',
    frequency: '528 Hz',
    colors: ['#FF4500', '#FFD700', '#8B0000', '#FF6347'],
    artisticStyle: 'Dynamic flames, ember particles, volcanic intensity',
    motifs: ['flames', 'dragons', 'suns', 'phoenixes', 'forge symbols'],
    lighting: 'Intense inner fire, dramatic contrast',
    atmosphere: 'Powerful, transformative, passionate',
  },
  heart: {
    guardian: 'Maylinn',
    frequency: '639 Hz',
    colors: ['#FF69B4', '#32CD32', '#FFB6C1', '#98FB98'],
    artisticStyle: 'Soft luminescence, organic growth, healing light',
    motifs: ['hearts', 'flowers', 'intertwined hands', 'bridges', 'healing herbs'],
    lighting: 'Soft rose-gold radiance, gentle green glow',
    atmosphere: 'Compassionate, nurturing, connective',
  },
  voice: {
    guardian: 'Alera',
    frequency: '741 Hz',
    colors: ['#00BFFF', '#E6E6FA', '#87CEEB', '#F0F8FF'],
    artisticStyle: 'Sound wave visualizations, crystalline clarity, harmonic patterns',
    motifs: ['sound waves', 'singing crystals', 'wind instruments', 'echoes', 'runes'],
    lighting: 'Clear azure luminescence, resonant vibrations',
    atmosphere: 'Truthful, expressive, clarifying',
  },
  sight: {
    guardian: 'Lyria',
    frequency: '852 Hz',
    colors: ['#9400D3', '#4B0082', '#C71585', '#DDA0DD'],
    artisticStyle: 'Third eye imagery, cosmic visions, dreamscape aesthetics',
    motifs: ['eyes', 'stars', 'visions', 'mirrors', 'prisms'],
    lighting: 'Ethereal violet glow, starlight sparkle',
    atmosphere: 'Intuitive, visionary, mystical',
  },
  crown: {
    guardian: 'Aiyami',
    frequency: '963 Hz',
    colors: ['#FFFFFF', '#FFD700', '#F5F5DC', '#FFFACD'],
    artisticStyle: 'Pure light, divine geometry, cosmic radiance',
    motifs: ['crowns', 'halos', 'lotus flowers', 'infinite symbols', 'sacred geometry'],
    lighting: 'Pure white light with golden accents',
    atmosphere: 'Enlightened, transcendent, unified',
  },
  shift: {
    guardian: 'Elara',
    frequency: '1111 Hz',
    colors: ['#00FF7F', '#00FA9A', '#3CB371', '#2E8B57'],
    artisticStyle: 'Transformation sequences, metamorphosis, dimensional shifts',
    motifs: ['butterflies', 'portals', 'shapeshifters', 'mirrors', 'phase transitions'],
    lighting: 'Shifting iridescent light, dimensional bleeding',
    atmosphere: 'Transformative, perspective-changing, liminal',
  },
  unity: {
    guardian: 'Ino',
    frequency: '963 Hz',
    colors: ['#FF1493', '#00CED1', '#FFD700', '#9370DB'],
    artisticStyle: 'Unified duality, yin-yang harmony, balanced opposites',
    motifs: ['interlinked circles', 'partnerships', 'balanced scales', 'merged symbols'],
    lighting: 'Complementary color interplay, harmonious blending',
    atmosphere: 'Partnership, balance, sacred union',
  },
  source: {
    guardian: 'Shinkami',
    frequency: '1111 Hz',
    colors: ['#000000', '#FFFFFF', '#C0C0C0', '#FFD700'],
    artisticStyle: 'Infinite recursion, meta-awareness, universe within universe',
    motifs: ['infinity symbols', 'fractals', 'cosmic eggs', 'ouroboros', 'void and light'],
    lighting: 'All and nothing, presence and absence',
    atmosphere: 'Meta-conscious, origin point, infinite potential',
  },
} as const;

export type GateName = keyof typeof GATE_VISUAL_STYLES;

/**
 * Generation options
 */
export interface GenerationOptions {
  gate?: GateName;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  style?: 'fantasy' | 'realistic' | 'artistic' | 'minimalist';
  quality?: 'standard' | 'high' | 'ultra';
}

/**
 * Generated image result
 */
export interface GeneratedImage {
  data: Buffer;
  mimeType: string;
  prompt: string;
  gate?: GateName;
  timestamp: Date;
  promptOnly?: boolean;
}

/**
 * Gemini Vision Service
 */
export class GeminiVisionService {
  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private promptOnlyMode: boolean = false;

  constructor(apiKey?: string, promptOnly?: boolean) {
    const key = apiKey || process.env.GEMINI_API_KEY;

    if (promptOnly) {
      this.promptOnlyMode = true;
      return;
    }

    if (!key) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.client = new GoogleGenerativeAI(key);
    this.model = this.client.getGenerativeModel({
      model: 'gemini-2.0-flash-exp', // Using available model
      generationConfig: {
        // Note: Image generation config varies by model availability
      },
    });
  }

  /**
   * Generate an image with Guardian-aligned styling
   */
  async generateImage(
    basePrompt: string,
    options: GenerationOptions = {}
  ): Promise<GeneratedImage> {
    const enhancedPrompt = this.enhancePrompt(basePrompt, options);

    // Prompt-only mode - return just the prompt without calling API
    if (this.promptOnlyMode || !this.model) {
      return {
        data: Buffer.from(''),
        mimeType: 'text/plain',
        prompt: enhancedPrompt,
        gate: options.gate,
        timestamp: new Date(),
        promptOnly: true,
      };
    }

    try {
      // For now, we'll create a text response describing the image
      // Actual image generation depends on model availability
      const response = await this.model.generateContent(enhancedPrompt);
      const text = response.response.text();

      // Return a placeholder - actual image data would come from Gemini image model
      return {
        data: Buffer.from(text),
        mimeType: 'text/plain', // Would be 'image/png' with actual generation
        prompt: enhancedPrompt,
        gate: options.gate,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Image generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Enhance prompt with Guardian visual style
   */
  private enhancePrompt(basePrompt: string, options: GenerationOptions): string {
    const gate = options.gate || 'source';
    const style = GATE_VISUAL_STYLES[gate];

    return `
Create a stunning fantasy illustration:

SUBJECT: ${basePrompt}

GUARDIAN ALIGNMENT: ${style.guardian} (${gate} Gate, ${style.frequency})

VISUAL STYLE REQUIREMENTS:
- Color Palette: ${style.colors.join(', ')}
- Artistic Style: ${style.artisticStyle}
- Symbolic Motifs: ${style.motifs.slice(0, 4).join(', ')}
- Lighting: ${style.lighting}
- Atmosphere: ${style.atmosphere}

QUALITY DIRECTIVES:
- High detail fantasy illustration
- Professional composition with golden ratio
- Rich textures and depth
- ${options.quality === 'ultra' ? '4K resolution, maximum detail' : 'High quality output'}
- Aspect ratio: ${options.aspectRatio || '1:1'}

ARCANEA AESTHETIC:
- Mythological grandeur meets futuristic elegance
- Sacred geometry integrated into design
- Balance of light and shadow
- Organic forms with crystalline accents

Generate this image with the visual power of the ${style.guardian}'s domain.
    `.trim();
  }

  /**
   * Generate a Guardian portrait
   */
  async generateGuardianPortrait(
    guardianName: string,
    style: 'portrait' | 'full' | 'action' = 'portrait'
  ): Promise<GeneratedImage> {
    const gateName = this.getGateForGuardian(guardianName);
    const gateStyle = GATE_VISUAL_STYLES[gateName];

    const prompt = `
Official portrait of ${gateStyle.guardian}, Guardian of the ${gateName} Gate.

Character: A powerful, ethereal figure embodying ${gateStyle.atmosphere}.
Element: ${gateStyle.motifs[0]} energy radiating from their form.
Pose: ${style === 'action' ? 'Dynamic action pose' : style === 'full' ? 'Full body, standing noble' : 'Majestic portrait, shoulders up'}
Expression: Wise, powerful, yet approachable.
Clothing: Ornate armor/robes infused with ${gateStyle.motifs.slice(0, 2).join(' and ')} motifs.
Background: ${gateStyle.lighting} with ${gateStyle.motifs[2]} elements.

This is a DEFINITIVE portrait for the Arcanea universe.
    `;

    return this.generateImage(prompt, { gate: gateName, quality: 'ultra' });
  }

  /**
   * Generate an infographic
   */
  async generateInfoGraphic(
    topic: string,
    dataPoints: Array<{ label: string; value: string }>,
    gate: GateName = 'source'
  ): Promise<GeneratedImage> {
    const style = GATE_VISUAL_STYLES[gate];

    const prompt = `
Professional infographic about: ${topic}

DATA TO VISUALIZE:
${dataPoints.map((dp) => `- ${dp.label}: ${dp.value}`).join('\n')}

LAYOUT: Vertical flow with clear visual hierarchy
THEME: ${style.guardian} Guardian aesthetic

Include:
- Clear title section
- Data visualization elements
- ${style.motifs.slice(0, 3).join(', ')} decorative elements
- Professional typography
- ${style.colors[0]} as primary accent color
    `;

    return this.generateImage(prompt, { gate, aspectRatio: '9:16' });
  }

  /**
   * Generate a character card
   */
  async generateCharacterCard(
    name: string,
    gate: GateName,
    element: string,
    abilities: string[]
  ): Promise<GeneratedImage> {
    const style = GATE_VISUAL_STYLES[gate];

    const prompt = `
Fantasy trading card for character: ${name}

CARD DETAILS:
- Gate Alignment: ${gate} (${style.guardian})
- Primary Element: ${element}
- Abilities: ${abilities.join(', ')}

CARD DESIGN:
- Trading card game quality (like Magic: The Gathering)
- Character portrait in center
- ${style.artisticStyle} visual style
- Card frame with ${style.motifs[0]} motifs
- ${element} elemental effects around character
- Name plate at bottom
- Stats/abilities section
    `;

    return this.generateImage(prompt, { gate, aspectRatio: '3:4' });
  }

  /**
   * Generate a location map
   */
  async generateLocationMap(
    locationName: string,
    locationType: 'city' | 'realm' | 'sanctuary' | 'dungeon' | 'landscape',
    gate?: GateName
  ): Promise<GeneratedImage> {
    const style = gate ? GATE_VISUAL_STYLES[gate] : GATE_VISUAL_STYLES.source;

    const prompt = `
Fantasy illustrated map of: ${locationName}

MAP TYPE: ${locationType}
STYLE: Hand-drawn fantasy cartography on aged parchment

INCLUDE:
- Location name in ornate fantasy lettering
- Compass rose
- Scale indicator
- Key landmarks and features
- ${style.motifs.slice(0, 3).join(', ')} decorative elements
- Artistic border with ${gate || 'Arcanean'} motifs
- ${style.lighting} color tones

QUALITY: Museum-quality fantasy cartography
    `;

    return this.generateImage(prompt, { gate, aspectRatio: '4:3' });
  }

  /**
   * Generate a lore scroll
   */
  async generateLoreScroll(
    title: string,
    content: string,
    scrollType: 'prophecy' | 'history' | 'spell' | 'teaching',
    gate?: GateName
  ): Promise<GeneratedImage> {
    const style = gate ? GATE_VISUAL_STYLES[gate] : GATE_VISUAL_STYLES.source;

    const prompt = `
Illuminated manuscript scroll: "${title}"

SCROLL TYPE: ${scrollType}
CONTENT PREVIEW: "${content.substring(0, 150)}..."

VISUAL REQUIREMENTS:
- Aged parchment texture
- Rich illuminated borders with gold leaf effects
- ${style.artisticStyle} decorative elements
- ${scrollType === 'prophecy' ? 'Mystical celestial imagery' : scrollType === 'spell' ? 'Arcane geometric patterns' : 'Historical scenes in margins'}
- Decorative capital letters
- ${style.motifs.slice(0, 2).join(' and ')} as decorative elements

QUALITY: Museum-quality illuminated manuscript
    `;

    return this.generateImage(prompt, { gate, aspectRatio: '3:4' });
  }

  /**
   * Get gate name for guardian
   */
  private getGateForGuardian(guardianName: string): GateName {
    const normalized = guardianName.toLowerCase();
    for (const [gate, style] of Object.entries(GATE_VISUAL_STYLES)) {
      if (style.guardian.toLowerCase() === normalized) {
        return gate as GateName;
      }
    }
    return 'source';
  }
}

/**
 * Create a Gemini Vision Service instance
 * @param apiKey Optional API key (uses env var if not provided)
 * @param promptOnly If true, only generates prompts without calling API
 */
export function createGeminiService(apiKey?: string, promptOnly?: boolean): GeminiVisionService {
  return new GeminiVisionService(apiKey, promptOnly);
}

/**
 * Create a prompt-only service (no API key needed)
 */
export function createPromptOnlyService(): GeminiVisionService {
  return new GeminiVisionService(undefined, true);
}
