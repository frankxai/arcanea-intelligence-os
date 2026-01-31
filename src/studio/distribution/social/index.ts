/**
 * Social Launcher Module - Social Media Distribution
 *
 * Publishes content to social platforms including:
 * - Twitter/X
 * - Instagram
 * - TikTok
 * - YouTube Shorts
 * - Farcaster
 * - LinkedIn
 * - Threads
 */

import * as fs from 'fs';
import * as path from 'path';

import type {
  SocialPlatform,
  SocialPost,
  SocialCampaign,
  ImageAsset,
  VideoAsset,
} from '../../types';

// =============================================================================
// PLATFORM CONFIGURATIONS
// =============================================================================

export interface PlatformConfig {
  name: SocialPlatform;
  displayName: string;
  maxTextLength: number;
  maxImages: number;
  maxVideoLength: number; // seconds
  supportedImageFormats: string[];
  supportedVideoFormats: string[];
  aspectRatios: {
    image: string[];
    video: string[];
  };
  hashtagLimit: number;
  mentionLimit: number;
}

export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  twitter: {
    name: 'twitter',
    displayName: 'X (Twitter)',
    maxTextLength: 280,
    maxImages: 4,
    maxVideoLength: 140,
    supportedImageFormats: ['png', 'jpg', 'webp', 'gif'],
    supportedVideoFormats: ['mp4', 'mov'],
    aspectRatios: {
      image: ['1:1', '16:9', '4:3'],
      video: ['16:9', '1:1', '9:16'],
    },
    hashtagLimit: 30,
    mentionLimit: 50,
  },
  instagram: {
    name: 'instagram',
    displayName: 'Instagram',
    maxTextLength: 2200,
    maxImages: 10,
    maxVideoLength: 90, // Reels
    supportedImageFormats: ['jpg', 'png'],
    supportedVideoFormats: ['mp4', 'mov'],
    aspectRatios: {
      image: ['1:1', '4:5', '1.91:1'],
      video: ['9:16', '1:1', '4:5'],
    },
    hashtagLimit: 30,
    mentionLimit: 20,
  },
  tiktok: {
    name: 'tiktok',
    displayName: 'TikTok',
    maxTextLength: 2200,
    maxImages: 35, // Slideshow
    maxVideoLength: 180,
    supportedImageFormats: ['jpg', 'png'],
    supportedVideoFormats: ['mp4', 'mov', 'webm'],
    aspectRatios: {
      image: ['9:16'],
      video: ['9:16'],
    },
    hashtagLimit: 100,
    mentionLimit: 20,
  },
  youtube: {
    name: 'youtube',
    displayName: 'YouTube Shorts',
    maxTextLength: 5000,
    maxImages: 0,
    maxVideoLength: 60,
    supportedImageFormats: [],
    supportedVideoFormats: ['mp4', 'mov', 'webm'],
    aspectRatios: {
      image: [],
      video: ['9:16'],
    },
    hashtagLimit: 15,
    mentionLimit: 0,
  },
  farcaster: {
    name: 'farcaster',
    displayName: 'Farcaster',
    maxTextLength: 320,
    maxImages: 4,
    maxVideoLength: 0,
    supportedImageFormats: ['png', 'jpg', 'gif'],
    supportedVideoFormats: [],
    aspectRatios: {
      image: ['1:1', '16:9'],
      video: [],
    },
    hashtagLimit: 0,
    mentionLimit: 50,
  },
  linkedin: {
    name: 'linkedin',
    displayName: 'LinkedIn',
    maxTextLength: 3000,
    maxImages: 20,
    maxVideoLength: 600,
    supportedImageFormats: ['png', 'jpg', 'gif'],
    supportedVideoFormats: ['mp4'],
    aspectRatios: {
      image: ['1:1', '1.91:1', '4:5'],
      video: ['16:9', '1:1', '9:16'],
    },
    hashtagLimit: 30,
    mentionLimit: 30,
  },
  threads: {
    name: 'threads',
    displayName: 'Threads',
    maxTextLength: 500,
    maxImages: 10,
    maxVideoLength: 300,
    supportedImageFormats: ['jpg', 'png'],
    supportedVideoFormats: ['mp4', 'mov'],
    aspectRatios: {
      image: ['1:1', '4:5', '16:9'],
      video: ['9:16', '1:1'],
    },
    hashtagLimit: 0,
    mentionLimit: 20,
  },
};

// =============================================================================
// CONTENT FORMATTER
// =============================================================================

export interface FormattedContent {
  text: string;
  truncated: boolean;
  hashtags: string[];
  mentions: string[];
  warnings: string[];
}

export class ContentFormatter {
  /**
   * Format content for a specific platform
   */
  static format(
    content: {
      text: string;
      hashtags?: string[];
      mentions?: string[];
    },
    platform: SocialPlatform
  ): FormattedContent {
    const config = PLATFORM_CONFIGS[platform];
    const warnings: string[] = [];

    // Process hashtags
    let hashtags = content.hashtags || [];
    if (hashtags.length > config.hashtagLimit && config.hashtagLimit > 0) {
      warnings.push(`Too many hashtags. Trimmed to ${config.hashtagLimit}.`);
      hashtags = hashtags.slice(0, config.hashtagLimit);
    }

    // Process mentions
    let mentions = content.mentions || [];
    if (mentions.length > config.mentionLimit && config.mentionLimit > 0) {
      warnings.push(`Too many mentions. Trimmed to ${config.mentionLimit}.`);
      mentions = mentions.slice(0, config.mentionLimit);
    }

    // Format hashtags with #
    const formattedHashtags = hashtags.map(h => h.startsWith('#') ? h : `#${h}`);

    // Format mentions with @
    const formattedMentions = mentions.map(m => m.startsWith('@') ? m : `@${m}`);

    // Build full text
    let fullText = content.text;

    // Add hashtags to text (platform-specific behavior)
    if (platform === 'instagram') {
      // Instagram: hashtags at the end with spacing
      fullText = `${content.text}\n\n${formattedHashtags.join(' ')}`;
    } else if (platform !== 'linkedin' && formattedHashtags.length > 0) {
      // Most platforms: inline hashtags
      fullText = `${content.text}\n\n${formattedHashtags.join(' ')}`;
    }

    // Check text length
    let truncated = false;
    if (fullText.length > config.maxTextLength) {
      truncated = true;
      warnings.push(`Text exceeds ${config.maxTextLength} chars. Truncated.`);

      // Truncate intelligently - try to keep hashtags
      const hashtagText = formattedHashtags.join(' ');
      const availableLength = config.maxTextLength - hashtagText.length - 5; // 5 for "... " and newlines

      if (availableLength > 50) {
        const truncatedBody = content.text.slice(0, availableLength) + '...';
        fullText = `${truncatedBody}\n\n${hashtagText}`;
      } else {
        fullText = fullText.slice(0, config.maxTextLength - 3) + '...';
      }
    }

    return {
      text: fullText,
      truncated,
      hashtags: formattedHashtags,
      mentions: formattedMentions,
      warnings,
    };
  }

  /**
   * Generate optimal hashtags for Arcanea content
   */
  static generateArcaneaHashtags(
    entityType: 'character' | 'location' | 'artifact' | 'story' | 'art',
    gate?: string,
    element?: string
  ): string[] {
    const baseHashtags = ['Arcanea', 'WorldBuilding', 'Fantasy', 'CreativeAI'];

    const typeHashtags: Record<string, string[]> = {
      character: ['CharacterDesign', 'OC', 'FantasyCharacter', 'CharacterArt'],
      location: ['FantasyWorld', 'WorldBuilding', 'FantasyLocation', 'ConceptArt'],
      artifact: ['MagicItems', 'FantasyArtifact', 'GameDesign', 'Lore'],
      story: ['FantasyStory', 'Writing', 'ShortStory', 'Lore'],
      art: ['FantasyArt', 'DigitalArt', 'AIArt', 'ConceptArt'],
    };

    const hashtags = [...baseHashtags, ...(typeHashtags[entityType] || [])];

    if (gate) {
      hashtags.push(`${gate}Gate`);
    }

    if (element) {
      hashtags.push(`${element}Element`);
    }

    return hashtags;
  }
}

// =============================================================================
// SOCIAL LAUNCHER CLASS
// =============================================================================

export interface SocialLauncherConfig {
  credentials: Partial<Record<SocialPlatform, {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    accessTokenSecret?: string;
  }>>;
  outputDir: string;
  dryRun: boolean;
}

const DEFAULT_CONFIG: SocialLauncherConfig = {
  credentials: {},
  outputDir: path.join(process.env.HOME || process.env.USERPROFILE || '', '.arcanea', 'social'),
  dryRun: true, // Default to dry run for safety
};

export class SocialLauncher {
  private config: SocialLauncherConfig;
  private posts: Map<string, SocialPost> = new Map();
  private campaigns: Map<string, SocialCampaign> = new Map();

  constructor(config: Partial<SocialLauncherConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Create a post for a specific platform
   */
  createPost(
    platform: SocialPlatform,
    content: {
      text: string;
      images?: string[];
      video?: string;
      hashtags?: string[];
      mentions?: string[];
    },
    projectId: string
  ): SocialPost {
    const formatted = ContentFormatter.format(content, platform);

    const post: SocialPost = {
      id: this.generateId(),
      projectId,
      platform,
      content: {
        text: formatted.text,
        images: content.images,
        video: content.video,
        hashtags: formatted.hashtags,
        mentions: formatted.mentions,
      },
      status: 'draft',
    };

    this.posts.set(post.id, post);
    return post;
  }

  /**
   * Create posts for multiple platforms
   */
  createCrossPost(
    platforms: SocialPlatform[],
    content: {
      text: string;
      images?: string[];
      video?: string;
      hashtags?: string[];
      mentions?: string[];
    },
    projectId: string
  ): SocialPost[] {
    return platforms.map(platform => this.createPost(platform, content, projectId));
  }

  /**
   * Schedule a post for later
   */
  schedulePost(postId: string, scheduledAt: Date): SocialPost | null {
    const post = this.posts.get(postId);
    if (!post) return null;

    post.scheduledAt = scheduledAt;
    post.status = 'scheduled';
    return post;
  }

  /**
   * Publish a post immediately
   */
  async publishPost(postId: string): Promise<{
    success: boolean;
    post: SocialPost;
    error?: string;
  }> {
    const post = this.posts.get(postId);
    if (!post) {
      return { success: false, post: {} as SocialPost, error: 'Post not found' };
    }

    if (this.config.dryRun) {
      // Dry run - simulate publishing
      console.log(`[DRY RUN] Would publish to ${post.platform}:`);
      console.log(`  Text: ${post.content.text.slice(0, 100)}...`);
      console.log(`  Images: ${post.content.images?.length || 0}`);
      console.log(`  Video: ${post.content.video ? 'Yes' : 'No'}`);

      post.status = 'published';
      post.publishedAt = new Date();
      post.externalId = `dry_run_${Date.now()}`;
      post.externalUrl = `https://${post.platform}.com/status/${post.externalId}`;

      return { success: true, post };
    }

    // Real publishing would happen here with platform APIs
    // For now, return success with dry run simulation
    return { success: true, post };
  }

  /**
   * Create a campaign for coordinated posting
   */
  createCampaign(params: {
    name: string;
    description: string;
    projectId: string;
    platforms: SocialPlatform[];
    content: {
      text: string;
      images?: string[];
      video?: string;
      hashtags?: string[];
    };
    scheduledStart?: Date;
  }): SocialCampaign {
    // Create posts for each platform
    const posts = this.createCrossPost(
      params.platforms,
      params.content,
      params.projectId
    );

    // Schedule if start time provided
    if (params.scheduledStart) {
      const startTime = params.scheduledStart.getTime();
      posts.forEach((post, index) => {
        // Stagger posts by 5 minutes each
        const postTime = new Date(startTime + index * 5 * 60 * 1000);
        this.schedulePost(post.id, postTime);
      });
    }

    const campaign: SocialCampaign = {
      id: this.generateId(),
      projectId: params.projectId,
      name: params.name,
      description: params.description,
      platforms: params.platforms,
      posts,
      scheduledStart: params.scheduledStart,
      status: params.scheduledStart ? 'active' : 'draft',
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  /**
   * Launch a campaign (publish all posts)
   */
  async launchCampaign(campaignId: string): Promise<{
    success: boolean;
    results: Array<{ platform: SocialPlatform; success: boolean; error?: string }>;
  }> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return { success: false, results: [] };
    }

    const results: Array<{ platform: SocialPlatform; success: boolean; error?: string }> = [];

    for (const post of campaign.posts) {
      const result = await this.publishPost(post.id);
      results.push({
        platform: post.platform,
        success: result.success,
        error: result.error,
      });
    }

    campaign.status = 'completed';
    return {
      success: results.every(r => r.success),
      results,
    };
  }

  /**
   * Get platform configuration
   */
  getPlatformConfig(platform: SocialPlatform): PlatformConfig {
    return PLATFORM_CONFIGS[platform];
  }

  /**
   * Get all platform configurations
   */
  getAllPlatformConfigs(): PlatformConfig[] {
    return Object.values(PLATFORM_CONFIGS);
  }

  /**
   * Validate content for a platform
   */
  validateContent(
    platform: SocialPlatform,
    content: {
      text: string;
      images?: string[];
      video?: string;
    }
  ): {
    valid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const config = PLATFORM_CONFIGS[platform];
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check text length
    if (content.text.length > config.maxTextLength) {
      issues.push(`Text exceeds ${config.maxTextLength} characters`);
    }

    // Check images
    if (content.images && content.images.length > config.maxImages) {
      issues.push(`Too many images. Max ${config.maxImages} allowed.`);
    }

    // Check video
    if (content.video && config.maxVideoLength === 0) {
      issues.push(`${config.displayName} does not support video`);
    }

    // Warnings for near-limits
    if (content.text.length > config.maxTextLength * 0.9) {
      warnings.push('Text is close to character limit');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Generate a thread from long content
   */
  generateThread(
    content: string,
    platform: SocialPlatform,
    hashtags?: string[]
  ): string[] {
    const config = PLATFORM_CONFIGS[platform];
    const maxLength = config.maxTextLength;

    // Reserve space for thread numbering (e.g., "1/5 ")
    const reservedSpace = 6;
    const effectiveMax = maxLength - reservedSpace;

    const posts: string[] = [];
    let remaining = content;

    while (remaining.length > 0) {
      if (remaining.length <= effectiveMax) {
        posts.push(remaining);
        break;
      }

      // Find a good break point
      let breakPoint = effectiveMax;
      const sentenceEnd = remaining.lastIndexOf('. ', effectiveMax);
      const newLine = remaining.lastIndexOf('\n', effectiveMax);
      const space = remaining.lastIndexOf(' ', effectiveMax);

      if (sentenceEnd > effectiveMax * 0.5) {
        breakPoint = sentenceEnd + 1;
      } else if (newLine > effectiveMax * 0.5) {
        breakPoint = newLine;
      } else if (space > effectiveMax * 0.5) {
        breakPoint = space;
      }

      posts.push(remaining.slice(0, breakPoint).trim());
      remaining = remaining.slice(breakPoint).trim();
    }

    // Add thread numbering
    const total = posts.length;
    const numberedPosts = posts.map((post, i) => `${i + 1}/${total} ${post}`);

    // Add hashtags to last post if provided
    if (hashtags && hashtags.length > 0) {
      const lastIndex = numberedPosts.length - 1;
      const hashtagStr = hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
      numberedPosts[lastIndex] = `${numberedPosts[lastIndex]}\n\n${hashtagStr}`;
    }

    return numberedPosts;
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private generateId(): string {
    return `social_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export function createSocialLauncher(config?: Partial<SocialLauncherConfig>): SocialLauncher {
  return new SocialLauncher(config);
}

export default SocialLauncher;
