# Arcanea Worldbuilding Studio - Master Architecture Plan

> *"Through the Gates we create. With the Guardians we manifest. As the Awakened, we build worlds."*

## Vision

A **Sophisticated Local-First Worldbuilding Studio** that:
1. Generates images, videos, and content using AI
2. Interconnects all Arcanea systems locally via daemon
3. Offers optional cloud push for community sharing
4. Integrates with social platforms for launch/distribution
5. Provides a complete creative pipeline from idea to publication

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ARCANEA WORLDBUILDING STUDIO                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        CREATION LAYER                                    │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│   │
│  │  │   SCRIBE     │  │   PAINTER    │  │  FILMMAKER   │  │   BARD       ││   │
│  │  │  Text/Story  │  │   Image AI   │  │   Video AI   │  │   Audio AI   ││   │
│  │  │              │  │              │  │              │  │              ││   │
│  │  │ - Opus/Sonnet│  │ - Gemini     │  │ - Runway     │  │ - Suno       ││   │
│  │  │ - Character  │  │ - DALL-E     │  │ - Pika       │  │ - ElevenLabs ││   │
│  │  │ - Worldbuild │  │ - Midjourney │  │ - Luma       │  │ - Udio       ││   │
│  │  │ - Lore       │  │ - Flux       │  │ - Kling      │  │ - Mubert     ││   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        ORCHESTRATION LAYER                               │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│  │  │                    AIOS DAEMON (localhost:3333)                   │  │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │   │
│  │  │  │   MCP    │  │   HTTP   │  │  State   │  │ Plugins  │         │  │   │
│  │  │  │  Server  │  │   API    │  │  Store   │  │ Registry │         │  │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │  │   │
│  │  │                                                                   │  │   │
│  │  │  ┌──────────────────────────────────────────────────────────┐   │  │   │
│  │  │  │              PROJECT MANAGER                              │   │  │   │
│  │  │  │  - Worlds / Realms / Regions / Locations                 │   │  │   │
│  │  │  │  - Characters / Factions / Relationships                 │   │  │   │
│  │  │  │  - Magic Systems / Technology / Artifacts                │   │  │   │
│  │  │  │  - Timeline / Events / History                           │   │  │   │
│  │  │  │  - Canon Validation / Anti-Drift Protection              │   │  │   │
│  │  │  └──────────────────────────────────────────────────────────┘   │  │   │
│  │  └──────────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        STORAGE LAYER                                     │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│   │
│  │  │   LIBRARY    │  │   GALLERY    │  │   THEATER    │  │   ARCHIVE    ││   │
│  │  │              │  │              │  │              │  │              ││   │
│  │  │  ~/arcanea/  │  │  ~/arcanea/  │  │  ~/arcanea/  │  │  ~/arcanea/  ││   │
│  │  │  library/    │  │  gallery/    │  │  theater/    │  │  archive/    ││   │
│  │  │              │  │              │  │              │  │              ││   │
│  │  │  - Texts     │  │  - Images    │  │  - Videos    │  │  - Versions  ││   │
│  │  │  - Lore      │  │  - Art       │  │  - Clips     │  │  - Backups   ││   │
│  │  │  - Stories   │  │  - Portraits │  │  - Trailers  │  │  - Exports   ││   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│   │
│  │                                                                         │   │
│  │                       SQLite: ~/.arcanea/studio.db                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        DISTRIBUTION LAYER                                │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                     SYNC ENGINE                                  │   │   │
│  │  │  ┌─────────┐  ┌─────────────────────────────────────────────┐  │   │   │
│  │  │  │ LOCAL   │  │              CLOUD (Optional)                │  │   │   │
│  │  │  │         │◄─┤                                              │  │   │   │
│  │  │  │ SQLite  │  │  Supabase (PostgreSQL + Storage + Auth)     │  │   │   │
│  │  │  │ Files   │─►│                                              │  │   │   │
│  │  │  └─────────┘  └─────────────────────────────────────────────┘  │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                   SOCIAL LAUNCHER                                │   │   │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────┐ │   │   │
│  │  │  │ Twitter │  │Instagram│  │ TikTok  │  │ YouTube │  │ Farcst│ │   │   │
│  │  │  │    X    │  │         │  │         │  │ Shorts  │  │       │ │   │   │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └───────┘ │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                   COMMUNITY HUB                                  │   │   │
│  │  │                                                                  │   │   │
│  │  │  Arcanea Platform: arcanea.io                                   │   │   │
│  │  │  - Publish creations to community                               │   │   │
│  │  │  - Discover others' worlds                                      │   │   │
│  │  │  - Collaborate on shared universes                              │   │   │
│  │  │  - Marketplace for assets                                       │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Breakdown

### 1. SCRIBE Module (Text/Story Generation)
**Purpose:** Generate stories, characters, worldbuilding content, lore

**Capabilities:**
- Character generation with full profiles
- Faction/organization creation
- Location descriptions with atmosphere
- Magic system design
- Technology/artifact creation
- Historical timeline generation
- Dialogue and narrative writing
- Canon-compliant validation

**Implementation:**
```typescript
interface ScribeModule {
  generateCharacter(params: CharacterParams): Promise<Character>;
  generateLocation(params: LocationParams): Promise<Location>;
  generateFaction(params: FactionParams): Promise<Faction>;
  generateArtifact(params: ArtifactParams): Promise<Artifact>;
  generateStory(params: StoryParams): Promise<Story>;
  generateDialogue(params: DialogueParams): Promise<Dialogue>;
  validateCanon(content: any): Promise<CanonValidation>;
}
```

### 2. PAINTER Module (Image Generation)
**Purpose:** Generate visual art for characters, locations, items

**Integrations:**
- Gemini Imagen (primary)
- DALL-E 3 (backup)
- Midjourney API (premium)
- Stable Diffusion (local option)
- Flux (open source)

**Capabilities:**
- Character portraits (multiple styles)
- Location panoramas
- Item/artifact renders
- Battle scenes
- Map generation
- Trading card creation
- Book covers
- Social media graphics

**Implementation:**
```typescript
interface PainterModule {
  generatePortrait(character: Character, style: ArtStyle): Promise<ImageAsset>;
  generateLocation(location: Location, style: ArtStyle): Promise<ImageAsset>;
  generateArtifact(artifact: Artifact, style: ArtStyle): Promise<ImageAsset>;
  generateScene(scene: SceneDescription): Promise<ImageAsset>;
  generateMap(world: World, type: MapType): Promise<ImageAsset>;
  generateCard(entity: any, template: CardTemplate): Promise<ImageAsset>;
  upscale(image: ImageAsset, factor: number): Promise<ImageAsset>;
}
```

### 3. FILMMAKER Module (Video Generation)
**Purpose:** Generate video content for trailers, shorts, scenes

**Integrations:**
- Runway Gen-3 (primary)
- Pika Labs
- Luma AI Dream Machine
- Kling AI
- Stable Video Diffusion (local)

**Capabilities:**
- Character animation
- Scene transitions
- Trailer generation
- Shorts/Reels creation
- Cinematic sequences
- Music video generation

**Implementation:**
```typescript
interface FilmmakerModule {
  generateClip(params: ClipParams): Promise<VideoAsset>;
  generateTrailer(project: Project): Promise<VideoAsset>;
  animateImage(image: ImageAsset, motion: MotionParams): Promise<VideoAsset>;
  createSequence(clips: VideoAsset[]): Promise<VideoAsset>;
  addEffects(video: VideoAsset, effects: Effect[]): Promise<VideoAsset>;
  generateShort(content: any, format: ShortFormat): Promise<VideoAsset>;
}
```

### 4. BARD Module (Audio Generation)
**Purpose:** Generate music, sound effects, voiceovers

**Integrations:**
- Suno AI (music)
- ElevenLabs (voice)
- Udio (music)
- Mubert (ambient)
- Bark (open source TTS)

**Capabilities:**
- Theme music generation
- Character voice synthesis
- Ambient soundscapes
- Sound effects
- Narration generation
- Podcast/audiobook creation

**Implementation:**
```typescript
interface BardModule {
  generateMusic(params: MusicParams): Promise<AudioAsset>;
  generateVoice(text: string, voice: VoiceProfile): Promise<AudioAsset>;
  generateAmbience(scene: Scene): Promise<AudioAsset>;
  generateSoundEffect(description: string): Promise<AudioAsset>;
  generateNarration(story: Story, narrator: VoiceProfile): Promise<AudioAsset>;
}
```

### 5. PROJECT MANAGER
**Purpose:** Organize and manage worldbuilding projects

**Data Model:**
```typescript
interface WorldProject {
  id: string;
  name: string;
  description: string;
  gate: GateName; // Arcanea alignment
  guardian: string;

  // Structural Elements
  realms: Realm[];
  regions: Region[];
  locations: Location[];

  // Characters & Factions
  characters: Character[];
  factions: Faction[];
  relationships: Relationship[];

  // Systems
  magicSystems: MagicSystem[];
  technologies: Technology[];
  artifacts: Artifact[];

  // History
  timeline: TimelineEvent[];
  eras: Era[];

  // Assets
  images: ImageAsset[];
  videos: VideoAsset[];
  audio: AudioAsset[];
  documents: Document[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  syncState: SyncState;
}
```

### 6. SYNC ENGINE
**Purpose:** Synchronize between local and cloud

**Capabilities:**
- Local-first operation
- Selective sync (choose what to push)
- Conflict resolution
- Version history
- Collaborative editing (cloud mode)

### 7. SOCIAL LAUNCHER
**Purpose:** Publish content to social platforms

**Platforms:**
- Twitter/X (text + images + video)
- Instagram (images + reels)
- TikTok (videos)
- YouTube Shorts
- Farcaster (web3)
- LinkedIn (articles)
- Threads

**Capabilities:**
- Format optimization per platform
- Scheduling
- Analytics tracking
- Thread generation
- Hashtag optimization
- Cross-posting

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Studio project structure
- [ ] Local database schema
- [ ] Basic SCRIBE module
- [ ] File organization system
- [ ] CLI commands for studio

### Phase 2: Image Generation (Week 2-3)
- [ ] PAINTER module with Gemini/DALL-E
- [ ] Image storage and indexing
- [ ] Style presets (Arcanea aesthetic)
- [ ] Character portrait pipeline
- [ ] Location art pipeline

### Phase 3: Video Generation (Week 3-4)
- [ ] FILMMAKER module with Runway
- [ ] Video storage and processing
- [ ] Image-to-video animation
- [ ] Trailer assembly pipeline
- [ ] Short-form content creation

### Phase 4: Audio Generation (Week 4-5)
- [ ] BARD module with Suno
- [ ] Music generation pipeline
- [ ] Voice synthesis integration
- [ ] Audio asset management
- [ ] Soundtrack creation workflow

### Phase 5: Project Management (Week 5-6)
- [ ] Full project data model
- [ ] World structure management
- [ ] Character relationship mapping
- [ ] Timeline visualization
- [ ] Canon validation system

### Phase 6: Cloud Sync (Week 6-7)
- [ ] Supabase integration
- [ ] Selective sync implementation
- [ ] Conflict resolution
- [ ] Version history
- [ ] Collaborative features

### Phase 7: Social Launch (Week 7-8)
- [ ] Platform API integrations
- [ ] Content format optimization
- [ ] Scheduling system
- [ ] Analytics dashboard
- [ ] Cross-posting automation

### Phase 8: Community Hub (Week 8+)
- [ ] Arcanea platform integration
- [ ] Publishing workflow
- [ ] Discovery features
- [ ] Marketplace foundation

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript |
| Runtime | Node.js 20+ |
| Database | SQLite (local) + Supabase (cloud) |
| CLI | Commander.js |
| HTTP | Express/Fastify |
| Build | tsup |
| AI Text | Claude (Opus/Sonnet), Gemini |
| AI Image | Gemini Imagen, DALL-E, Midjourney |
| AI Video | Runway, Pika, Luma |
| AI Audio | Suno, ElevenLabs |
| Storage | Local filesystem + Supabase Storage |
| Auth | Supabase Auth |

---

## File Structure

```
arcanea-studio/
├── src/
│   ├── modules/
│   │   ├── scribe/           # Text generation
│   │   ├── painter/          # Image generation
│   │   ├── filmmaker/        # Video generation
│   │   └── bard/            # Audio generation
│   ├── project/
│   │   ├── manager.ts       # Project management
│   │   ├── entities/        # World entities
│   │   └── validation.ts    # Canon validation
│   ├── storage/
│   │   ├── local.ts         # Local SQLite
│   │   ├── cloud.ts         # Supabase sync
│   │   └── assets.ts        # Asset management
│   ├── distribution/
│   │   ├── sync.ts          # Sync engine
│   │   ├── social/          # Social platforms
│   │   └── community.ts     # Community hub
│   └── cli/
│       └── studio.ts        # CLI commands
├── templates/
│   ├── characters/
│   ├── locations/
│   └── projects/
├── presets/
│   ├── art-styles/
│   └── music-styles/
└── package.json
```

---

## CLI Commands

```bash
# Studio Management
aios studio init <name>          # Create new world project
aios studio list                 # List all projects
aios studio open <name>          # Set active project
aios studio status               # Show project status

# Creation
aios create character <name>     # Generate character
aios create location <name>      # Generate location
aios create artifact <name>      # Generate artifact
aios create faction <name>       # Generate faction

# Art Generation
aios paint portrait <character>  # Generate character portrait
aios paint location <location>   # Generate location art
aios paint scene <description>   # Generate scene
aios paint card <entity>         # Generate trading card

# Video Generation
aios film clip <description>     # Generate short clip
aios film trailer                # Generate project trailer
aios film animate <image>        # Animate image
aios film short <type>           # Create short-form content

# Audio Generation
aios compose theme               # Generate theme music
aios compose ambience <scene>    # Generate ambient music
aios speak <text>                # Generate voiceover
aios narrate <story>             # Generate narration

# Distribution
aios sync status                 # Check sync status
aios sync push                   # Push to cloud
aios sync pull                   # Pull from cloud
aios publish <platform>          # Publish to platform
aios launch campaign             # Multi-platform launch
```

---

## Success Metrics

- Create complete character profile in <2 minutes
- Generate high-quality portrait in <30 seconds
- Produce 15-second video clip in <2 minutes
- Sync to cloud in <5 seconds (per MB)
- Cross-post to 5 platforms in <1 minute

---

## Next Steps

1. Create studio module structure
2. Implement SCRIBE with character generation
3. Implement PAINTER with Gemini integration
4. Create project management system
5. Build CLI interface
6. Add social platform integrations

---

*"In the Studio, worlds are born. Through creation, we become creators."*
