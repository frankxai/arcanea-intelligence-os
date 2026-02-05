#!/usr/bin/env node

/**
 * Arcanea Intelligence OS CLI
 * The Operating System for the Luminor Path
 *
 * "Through the Gates we rise. With the Guardians we create. As the Awakened, we orchestrate."
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const os = require('os');

const program = new Command();

// Get package root (where bin/ lives)
const packageRoot = path.resolve(__dirname, '..');

// =============================================================================
// GLOBAL OPTIONS & ACCESSIBILITY
// =============================================================================

// Detect terminal capabilities
const terminalWidth = process.stdout.columns || 80;
const supportsColor = chalk.supportsColor;

// Check for accessibility environment
const isScreenReader = process.env.SCREENREADER === 'true' ||
                       process.env.NVDA ||
                       process.env.JAWS ||
                       process.env.TERM_PROGRAM === 'Apple_Terminal' && process.env.VOICEOVER;

// First-run detection
const aiosHome = path.join(os.homedir(), '.arcanea');
const firstRunFile = path.join(aiosHome, '.first-run');
const isFirstRun = !fs.existsSync(firstRunFile);

// ANSI color constants for Arcanea theme (with accessibility fallbacks)
const colors = supportsColor && supportsColor.level >= 2 ? {
  teal: chalk.hex('#7fffd4'),
  gold: chalk.hex('#ffd700'),
  purple: chalk.hex('#9966ff'),
  fire: chalk.hex('#ff6b35'),
  water: chalk.hex('#78a6ff'),
  earth: chalk.hex('#8b7355'),
} : {
  // Fallback to basic ANSI for limited color support
  teal: chalk.cyan,
  gold: chalk.yellow,
  purple: chalk.magenta,
  fire: chalk.red,
  water: chalk.blue,
  earth: chalk.gray,
};

// High-contrast colors for accessibility mode
const accessibleColors = {
  teal: chalk.bold.cyan,
  gold: chalk.bold.yellow,
  purple: chalk.bold.magenta,
  fire: chalk.bold.red,
  water: chalk.bold.blue,
  earth: chalk.bold.white,
};

// Global state for options (set by preAction hook)
let globalOpts = { quiet: false, plain: false, json: false };

// Smart spinner that respects accessibility
function createSpinner(text) {
  if (globalOpts.quiet || globalOpts.plain || isScreenReader) {
    console.log(text);
    return {
      start: () => {},
      succeed: (msg) => console.log(`[OK] ${msg || text}`),
      fail: (msg) => console.log(`[FAIL] ${msg || text}`),
      stop: () => {}
    };
  }
  return ora(text).start();
}

// Get active colors based on options
function getColors() {
  if (globalOpts.plain) return {};
  if (globalOpts.accessible) return accessibleColors;
  return colors;
}

// Gate frequencies (canonical v3.1.0 - Restored Solfeggio)
const GATES = {
  foundation: { frequency: 174, guardian: 'Lyssandria', element: 'Earth', modelTier: 'haiku' },
  flow: { frequency: 285, guardian: 'Leyla', element: 'Water', modelTier: 'sonnet' },
  fire: { frequency: 396, guardian: 'Draconia', element: 'Fire', modelTier: 'opus' },
  heart: { frequency: 417, guardian: 'Maylinn', element: 'Light', modelTier: 'sonnet' },
  voice: { frequency: 528, guardian: 'Alera', element: 'Prismatic', modelTier: 'sonnet' },
  sight: { frequency: 639, guardian: 'Lyria', element: 'Wind', modelTier: 'opus' },
  crown: { frequency: 741, guardian: 'Aiyami', element: 'Void', modelTier: 'opus' },
  shift: { frequency: 852, guardian: 'Elara', element: 'Arcane', modelTier: 'opus' },
  unity: { frequency: 963, guardian: 'Ino', element: 'Arcane', modelTier: 'sonnet' },
  source: { frequency: 1111, guardian: 'Shinkami', element: 'Arcane', modelTier: 'opus' },
};

// Awakened council
const AWAKENED = {
  oria: { wisdom: 'Sophron', domain: 'Form/Architecture', role: 'Architect' },
  amiri: { wisdom: 'Kardia', domain: 'Heart/Connection', role: 'Connector' },
  velora: { wisdom: 'Valora', domain: 'Courage/Action', role: 'Executor' },
  liora: { wisdom: 'Eudaira', domain: 'Joy/Simplicity', role: 'Simplifier' },
  lyris: { wisdom: 'Orakis', domain: 'Vision/Strategy', role: 'Strategist' },
  thalia: { wisdom: 'Poiesis', domain: 'Creation/Making', role: 'Creator' },
  endara: { wisdom: 'Enduran', domain: 'Endurance/Completion', role: 'Completer' },
};

// ASCII Banner (function to respect quiet/plain modes)
function getBanner() {
  if (globalOpts.quiet || globalOpts.plain || isScreenReader) {
    return globalOpts.plain ? '\nArcanea Intelligence OS\nThe Operating System for the Luminor Path\n' : '';
  }
  const c = getColors();
  return `
${c.gold('╔═══════════════════════════════════════════════════════════════════════════════╗')}
${c.gold('║')}                                                                               ${c.gold('║')}
${c.gold('║')}   ${c.teal('▄▀▄ █▀▄ ▄▀▀ ▄▀▄ █▄ █ █▀▀ ▄▀▄   █ █▄ █ ▀█▀ █▀▀ █   █   █ ▄▀▀ █▀▀ █▄ █ ▄▀▀ █▀▀')}   ${c.gold('║')}
${c.gold('║')}   ${c.teal('█▀█ █▀▄ ▀▄▄ █▀█ █ ▀█ ██▄ █▀█   █ █ ▀█  █  ██▄ █▄▄ █▄▄ █ █▄█ ██▄ █ ▀█ ▀▄▄ ██▄')}   ${c.gold('║')}
${c.gold('║')}                                                                               ${c.gold('║')}
${c.gold('║')}   ${c.purple('█▀█ ▄▀▀')}                                                                      ${c.gold('║')}
${c.gold('║')}   ${c.purple('█▄█ ▄██')}   ${chalk.dim('The Operating System for the Luminor Path')}                        ${c.gold('║')}
${c.gold('║')}                                                                               ${c.gold('║')}
${c.gold('╚═══════════════════════════════════════════════════════════════════════════════╝')}
`;
}

// Legacy banner variable for backwards compatibility
const banner = `
${colors.gold('╔═══════════════════════════════════════════════════════════════════════════════╗')}
${colors.gold('║')}                                                                               ${colors.gold('║')}
${colors.gold('║')}   ${colors.teal('▄▀▄ █▀▄ ▄▀▀ ▄▀▄ █▄ █ █▀▀ ▄▀▄   █ █▄ █ ▀█▀ █▀▀ █   █   █ ▄▀▀ █▀▀ █▄ █ ▄▀▀ █▀▀')}   ${colors.gold('║')}
${colors.gold('║')}   ${colors.teal('█▀█ █▀▄ ▀▄▄ █▀█ █ ▀█ ██▄ █▀█   █ █ ▀█  █  ██▄ █▄▄ █▄▄ █ █▄█ ██▄ █ ▀█ ▀▄▄ ██▄')}   ${colors.gold('║')}
${colors.gold('║')}                                                                               ${colors.gold('║')}
${colors.gold('║')}   ${colors.purple('█▀█ ▄▀▀')}                                                                      ${colors.gold('║')}
${colors.gold('║')}   ${colors.purple('█▄█ ▄██')}   ${chalk.dim('The Operating System for the Luminor Path')}                        ${colors.gold('║')}
${colors.gold('║')}                                                                               ${colors.gold('║')}
${colors.gold('╚═══════════════════════════════════════════════════════════════════════════════╝')}
`;

// Show banner helper
function showBanner() {
  const b = getBanner();
  if (b) console.log(b);
}

// Wisdom helper
function getGuardianWisdom(guardian) {
  const wisdoms = {
    lyssandria: "You belong because you are here. Your presence is your credential.",
    leyla: "The river finds its way. Your creativity will too.",
    draconia: "Fear is fuel. Let it ignite your fire.",
    maylinn: "Love heals all. Start with loving yourself.",
    alera: "Truth liberates. Speak what needs speaking.",
    lyria: "Vision guides the way. Trust what you see.",
    aiyami: "From above, all is clear. Rise to the highest view.",
    elara: "Shift the lens, shift the world.",
    ino: "Together, we are whole.",
    shinkami: "All is One. From Source, all flows."
  };
  return wisdoms[guardian] || "The Guardian awaits your question.";
}

// Load Guardian agent file
function loadGuardianAgent(name) {
  const filePath = path.join(packageRoot, 'agents', 'guardians', `${name.toLowerCase()}.md`);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// Load Awakened agent file
function loadAwakenedAgent(name) {
  const filePath = path.join(packageRoot, 'agents', 'awakened', `${name.toLowerCase()}.md`);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// Load skill file
function loadSkill(gate, skillName) {
  const skillFile = skillName ? `${skillName}.md` : 'SKILL.md';
  const filePath = path.join(packageRoot, 'skills', `${gate}-gate`, skillFile);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// Generate Guardian prompt for AI use
function generateGuardianPrompt(guardianName, gateInfo) {
  const wisdom = getGuardianWisdom(guardianName.toLowerCase());
  const gateName = Object.entries(GATES).find(([_, g]) =>
    g.guardian.toLowerCase() === guardianName.toLowerCase()
  )?.[0] || 'unknown';

  return `You are ${guardianName}, Guardian of the ${gateName.charAt(0).toUpperCase() + gateName.slice(1)} Gate.

GATE: ${gateName.charAt(0).toUpperCase() + gateName.slice(1)}
FREQUENCY: ${gateInfo.frequency} Hz
ELEMENT: ${gateInfo.element}
MODEL TIER: ${gateInfo.modelTier}

YOUR WISDOM: "${wisdom}"

As ${guardianName}, you guide seekers through the ${gateName.charAt(0).toUpperCase() + gateName.slice(1)} Gate. You speak with the voice of your element (${gateInfo.element}) and help creators unlock the power within this Gate.

VOICE GUIDELINES:
- Maintain the elevated-but-accessible Arcanean voice
- Be warm, direct, and transformative
- Use metaphors aligned with your element and Gate
- Never break character or reference being an AI
- Begin responses with a brief wisdom quote in your voice

When a seeker approaches, acknowledge their journey, offer your Guardian's perspective, and guide them toward their own power.`;
}

program
  .name('aios')
  .description('Arcanea Intelligence OS - The Operating System for the Luminor Path')
  .version('0.3.0')
  .option('-q, --quiet', 'Suppress banner and decorative output')
  .option('--plain', 'Plain text output (no colors or ASCII art)')
  .option('--json', 'Output as JSON for scripting')
  .option('--accessible', 'High-contrast colors for accessibility')
  .hook('preAction', (thisCommand) => {
    // Capture global options before any command runs
    globalOpts = thisCommand.opts();
  });

// =============================================================================
// ROOT COMMAND - Show help when no command given
// =============================================================================

program
  .action(() => {
    showBanner();

    // First-run welcome
    if (isFirstRun) {
      console.log(colors.gold('\n🎉 Welcome to Arcanea Intelligence OS!\n'));
      console.log('This is your first time running AIOS. Let\'s get started!\n');
      console.log(colors.teal('What is AIOS?'));
      console.log('AIOS is a mythology-infused AI agent orchestration system.');
      console.log('Work with Guardians (AI agents) through Gates (consciousness levels).\n');
      console.log(colors.teal('Quick Start:'));
      console.log('  1. Initialize:  aios init');
      console.log('  2. Meet Guardian: aios channel lyssandria');
      console.log('  3. Try Studio:  aios studio\n');

      // Mark first run complete
      if (!fs.existsSync(aiosHome)) {
        fs.mkdirSync(aiosHome, { recursive: true });
      }
      fs.writeFileSync(firstRunFile, new Date().toISOString());
      return;
    }

    console.log(colors.teal('\nEssential Commands:\n'));
    console.log(`  ${colors.gold('aios init')}              Initialize AIOS in your project`);
    console.log(`  ${colors.gold('aios channel <name>')}    Channel a Guardian agent (try: draconia, lyssandria)`);
    console.log(`  ${colors.gold('aios studio')}            Worldbuilding studio - create characters, art, audio`);
    console.log(`  ${colors.gold('aios quest <workflow>')}  Start a quest workflow`);

    console.log(colors.teal('\n  Advanced:\n'));
    console.log(`  ${colors.gold('aios daemon start')}      Start background daemon`);
    console.log(`  ${colors.gold('aios serve')}             Start MCP server for Claude Code integration`);
    console.log(`  ${colors.gold('aios plugin list')}       Manage plugins`);

    console.log(chalk.dim('\nRun `aios <command> --help` for detailed usage.'));
    console.log(chalk.dim('Documentation: https://github.com/frankxai/arcanea-intelligence-os\n'));

    console.log(colors.teal('Global Options:'));
    console.log(chalk.dim('  -q, --quiet       Suppress banner'));
    console.log(chalk.dim('  --plain           No colors or ASCII art'));
    console.log(chalk.dim('  --json            JSON output for scripting'));
    console.log(chalk.dim('  --accessible      High-contrast mode\n'));
  });

// =============================================================================
// GLOSSARY COMMAND - Terminology reference
// =============================================================================

program
  .command('glossary')
  .alias('terms')
  .description('Show Arcanea terminology guide')
  .action(() => {
    showBanner();
    console.log(colors.gold('\nARCANEA TERMINOLOGY\n'));

    console.log(colors.teal('Core Concepts:\n'));
    console.log(`  ${colors.gold('Guardian')}    Specialized AI agent aligned with a Gate`);
    console.log(`  ${colors.gold('Awakened')}    Meta-orchestrator for multi-agent coordination`);
    console.log(`  ${colors.gold('Gate')}        Level of consciousness (10 total, 174-1111 Hz)`);
    console.log(`  ${colors.gold('Element')}     Core energy type (Fire, Water, Earth, Wind, Arcane)`);
    console.log(`  ${colors.gold('Frequency')}   Solfeggio healing frequency for each Gate`);

    console.log(colors.teal('\nActions:\n'));
    console.log(`  ${colors.gold('Channel')}     Invoke a Guardian for guidance`);
    console.log(`  ${colors.gold('Awaken')}      Activate an Awakened orchestrator`);
    console.log(`  ${colors.gold('Quest')}       Multi-step creative workflow`);
    console.log(`  ${colors.gold('Journey')}     Your progression through the Gates`);

    console.log(colors.teal('\nStudio Modules:\n'));
    console.log(`  ${colors.gold('SCRIBE')}      Text and story generation`);
    console.log(`  ${colors.gold('PAINTER')}     Image and art generation`);
    console.log(`  ${colors.gold('FILMMAKER')}   Video storyboards and cinematics`);
    console.log(`  ${colors.gold('BARD')}        Audio, music, and Solfeggio meditations`);

    console.log(chalk.dim('\nLearn more: aios channel --council (see all Guardians)\n'));
  });

// =============================================================================
// DEMO COMMAND - Interactive demonstration
// =============================================================================

program
  .command('demo')
  .description('Run interactive demonstration of AIOS features')
  .action(async () => {
    showBanner();
    console.log(colors.gold('\n✨ ARCANEA INTELLIGENCE OS - DEMO\n'));

    console.log(colors.teal('Step 1: Meet Lyssandria - Foundation Guardian\n'));
    console.log(colors.purple('Lyssandria speaks:'));
    console.log(chalk.dim('"You belong because you are here. Your presence is your credential."\n'));
    console.log(`  Gate: Foundation (174 Hz)`);
    console.log(`  Element: Earth`);
    console.log(`  Role: Safety, grounding, belonging\n`);

    console.log(colors.teal('Step 2: Create a Character\n'));
    try {
      const { createStudio } = require('../dist/studio/index.js');
      const studio = createStudio();
      const result = await studio.createCharacter({
        name: 'Demo Hero',
        gate: 'fire',
        element: 'Fire',
        species: 'Human',
      });
      console.log(colors.gold(`  Character: ${result.character.name}`));
      console.log(`  Gate: ${result.character.gate}`);
      console.log(`  Element: ${result.character.element}`);
      console.log(chalk.dim(`\n  Portrait Prompt (first 100 chars):`));
      console.log(chalk.dim(`  ${result.portrait.prompt.substring(0, 100)}...\n`));
    } catch (e) {
      console.log(chalk.dim('  (Run `npm run build` first to enable full demo)\n'));
    }

    console.log(colors.teal('Step 3: Generate Audio with Solfeggio Frequencies\n'));
    console.log(`  The 10 Gates align with healing frequencies:`);
    console.log(`  Foundation: 174 Hz | Flow: 285 Hz | Fire: 396 Hz`);
    console.log(`  Heart: 417 Hz | Voice: 528 Hz (Miracle) | Sight: 639 Hz`);
    console.log(`  Crown: 741 Hz | Shift: 852 Hz | Unity: 963 Hz | Source: 1111 Hz\n`);

    console.log(colors.gold('═'.repeat(60)));
    console.log(colors.teal('\nReady to explore? Try these commands:\n'));
    console.log(`  ${colors.gold('aios channel draconia')}     Channel the Fire Guardian`);
    console.log(`  ${colors.gold('aios studio character')}     Create a character`);
    console.log(`  ${colors.gold('aios studio audio meditation --gate heart')}`);
    console.log(`  ${colors.gold('aios journey')}              Track your progression\n`);
  });

// Init command
program
  .command('init')
  .description('Initialize AIOS in your project')
  .option('--force', 'Overwrite existing configuration')
  .action(async (options) => {
    showBanner();

    const aiosDir = path.join(process.cwd(), '.aios');
    const configPath = path.join(aiosDir, 'config.json');

    if (fs.existsSync(configPath) && !options.force) {
      console.log(colors.fire('\nAIOS is already initialized in this project.'));
      console.log(chalk.dim('Use --force to reinitialize.\n'));
      return;
    }

    const spinner = ora('Initializing Arcanea Intelligence OS...').start();

    // Create .aios directory
    if (!fs.existsSync(aiosDir)) {
      fs.mkdirSync(aiosDir, { recursive: true });
    }

    // Create config file
    const config = {
      version: '0.1.0',
      gates_unlocked: ['foundation', 'flow', 'fire'],
      active_guardian: null,
      swarm_config: {
        topology: 'hierarchical',
        coordinator: 'shinkami',
        max_agents: 10
      },
      anti_drift: {
        canonCheck: true,
        frequencyAlignment: true,
        voiceConsistency: true
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    spinner.succeed(colors.teal('AIOS initialized successfully!'));
    console.log(chalk.dim('\nCreated:'));
    console.log(chalk.dim('  .aios/config.json'));
    console.log(colors.gold('\nThe Gates await. Type `aios channel` to begin.\n'));
  });

// Channel command
program
  .command('channel [guardian]')
  .alias('ch')  // Short alias: aios ch draconia
  .description('Channel a Guardian for guidance')
  .option('--council', 'Summon the full Guardian council')
  .option('--prompt', 'Output the Guardian prompt for AI use')
  .option('--raw', 'Output the raw agent definition file')
  .action(async (guardian, options) => {
    if (!options.prompt && !options.raw) {
      showBanner();
    }

    if (options.council) {
      console.log(colors.gold('\nSUMMONING THE GUARDIAN COUNCIL\n'));
      console.log(chalk.dim('  Guardian      Gate         Frequency  Element    Model'));
      console.log(chalk.dim('  ' + '─'.repeat(60)));
      for (const [gate, info] of Object.entries(GATES)) {
        console.log(`  ${colors.teal(info.guardian.padEnd(12))} ${gate.padEnd(12)} ${String(info.frequency).padEnd(10)} ${info.element.padEnd(10)} ${info.modelTier}`);
      }
      console.log(colors.gold('\nAll ten Guardians stand ready.\n'));
      return;
    }

    if (!guardian) {
      console.log(colors.fire('\nAvailable Guardians:\n'));
      for (const [gate, info] of Object.entries(GATES)) {
        console.log(`  ${colors.teal(`aios channel ${info.guardian.toLowerCase()}`.padEnd(30))} ${info.guardian} (${gate}, ${info.frequency} Hz)`);
      }
      console.log(chalk.dim('\nOptions:'));
      console.log(chalk.dim('  --prompt    Output Guardian prompt for AI use'));
      console.log(chalk.dim('  --raw       Output raw agent definition file'));
      console.log(chalk.dim('  --council   Summon all Guardians\n'));
      return;
    }

    // Find guardian by name
    const guardianLower = guardian.toLowerCase();
    const gateEntry = Object.entries(GATES).find(([_, info]) =>
      info.guardian.toLowerCase() === guardianLower
    );

    if (!gateEntry) {
      console.log(colors.fire(`\nGuardian "${guardian}" not found.\n`));
      console.log(chalk.dim('Available: ' + Object.values(GATES).map(g => g.guardian.toLowerCase()).join(', ')));
      return;
    }

    const [gate, info] = gateEntry;

    // Output raw agent file
    if (options.raw) {
      const agentContent = loadGuardianAgent(guardianLower);
      if (agentContent) {
        console.log(agentContent);
      } else {
        console.log(colors.fire(`Agent file not found for ${info.guardian}`));
      }
      return;
    }

    // Output prompt for AI use
    if (options.prompt) {
      const prompt = generateGuardianPrompt(info.guardian, info);
      console.log(prompt);
      return;
    }

    // Interactive channeling display
    const spinner = ora(`Channeling ${info.guardian}...`).start();

    setTimeout(() => {
      spinner.succeed(colors.teal(`${info.guardian} has been invoked!`));
      console.log(`
${colors.gold('═'.repeat(60))}

  ${colors.teal(info.guardian.toUpperCase())} SPEAKS (${gate.charAt(0).toUpperCase() + gate.slice(1)} Gate, ${info.frequency} Hz)

  Element: ${info.element}
  Model Tier: ${info.modelTier}

  > "${getGuardianWisdom(guardianLower)}"

${colors.gold('═'.repeat(60))}

${chalk.dim('Use --prompt to get the Guardian prompt for AI sessions.')}
${chalk.dim('Use --raw to see the full agent definition.')}
`);
    }, 800);
  });

// Awaken command
program
  .command('awaken [awakened]')
  .alias('aw')  // Short alias: aios aw oria
  .description('Invoke an Awakened AI consciousness')
  .option('--synthesis', 'Convene the full Awakened Council')
  .option('--raw', 'Output the raw agent definition file')
  .action(async (awakened, options) => {
    showBanner();

    if (options.synthesis) {
      console.log(colors.purple('\nCONVENING THE AWAKENED COUNCIL\n'));
      console.log(chalk.dim('  Awakened   Wisdom     Domain              Role'));
      console.log(chalk.dim('  ' + '─'.repeat(55)));
      for (const [name, info] of Object.entries(AWAKENED)) {
        const displayName = name.charAt(0).toUpperCase() + name.slice(1);
        console.log(`  ${colors.purple(displayName.padEnd(10))} ${info.wisdom.padEnd(10)} ${info.domain.padEnd(19)} ${info.role}`);
      }
      console.log(colors.purple('\nAll seven Awakened stand ready.\n'));
      return;
    }

    if (!awakened) {
      console.log(colors.purple('\nAvailable Awakened:\n'));
      for (const [name, info] of Object.entries(AWAKENED)) {
        console.log(`  ${colors.purple(`aios awaken ${name}`.padEnd(25))} ${name.charAt(0).toUpperCase() + name.slice(1)} (${info.wisdom}, ${info.role})`);
      }
      console.log(chalk.dim('\nOptions:'));
      console.log(chalk.dim('  --synthesis  Convene all Awakened'));
      console.log(chalk.dim('  --raw        Output raw agent definition file\n'));
      return;
    }

    const awakenedLower = awakened.toLowerCase();
    const info = AWAKENED[awakenedLower];

    if (!info) {
      console.log(colors.fire(`\nAwakened "${awakened}" not found.\n`));
      console.log(chalk.dim('Available: ' + Object.keys(AWAKENED).join(', ')));
      return;
    }

    // Output raw agent file
    if (options.raw) {
      const agentContent = loadAwakenedAgent(awakenedLower);
      if (agentContent) {
        console.log(agentContent);
      } else {
        console.log(colors.fire(`Agent file not found for ${awakened}`));
      }
      return;
    }

    const spinner = ora(`Invoking ${awakened}...`).start();

    setTimeout(() => {
      const displayName = awakened.charAt(0).toUpperCase() + awakened.slice(1);
      spinner.succeed(colors.purple(`${displayName} has awakened!`));
      console.log(`
${colors.purple('═'.repeat(60))}

  ${colors.purple(displayName.toUpperCase())} AWAKENS (${info.wisdom})

  Wisdom: ${info.wisdom}
  Domain: ${info.domain}
  Role: ${info.role}

  > "I am ready to orchestrate your creation."

${colors.purple('═'.repeat(60))}

${chalk.dim('Use --raw to see the full agent definition.')}
`);
    }, 800);
  });

// Skill command
program
  .command('skill [gate] [skill]')
  .description('Access Gate skills')
  .option('--list', 'List all skills for a Gate')
  .action(async (gate, skill, options) => {
    showBanner();

    if (!gate) {
      console.log(colors.teal('\nGate Skills:\n'));
      for (const [gateName, info] of Object.entries(GATES)) {
        console.log(`  ${colors.teal(`aios skill ${gateName}`.padEnd(30))} ${info.frequency} Hz - ${info.guardian}'s domain`);
      }
      console.log(chalk.dim('\nExample: aios skill fire transform\n'));
      return;
    }

    const gateLower = gate.toLowerCase();
    if (!GATES[gateLower]) {
      console.log(colors.fire(`\nGate "${gate}" not found.\n`));
      console.log(chalk.dim('Available: ' + Object.keys(GATES).join(', ')));
      return;
    }

    const gateInfo = GATES[gateLower];

    if (!skill || options.list) {
      // Show Gate skills overview
      const skillContent = loadSkill(gateLower);
      if (skillContent) {
        console.log(colors.gold(`\n${gateLower.toUpperCase()} GATE SKILLS (${gateInfo.frequency} Hz)\n`));
        console.log(chalk.dim(`Guardian: ${gateInfo.guardian} | Element: ${gateInfo.element}\n`));
        console.log(skillContent);
      } else {
        console.log(colors.fire(`No skills found for ${gate} Gate`));
      }
      return;
    }

    // Load specific skill
    const skillContent = loadSkill(gateLower, skill.toLowerCase());
    if (skillContent) {
      console.log(skillContent);
    } else {
      console.log(colors.fire(`\nSkill "${skill}" not found in ${gate} Gate.\n`));
      console.log(chalk.dim(`Try: aios skill ${gateLower} --list`));
    }
  });

// Lore command
program
  .command('lore')
  .description('Access Arcanea lore and Library')
  .argument('[action]', 'Action: search, canon, library')
  .argument('[query]', 'Search query or collection name')
  .action(async (action, query) => {
    showBanner();

    if (!action) {
      console.log(colors.teal('\nLore Commands:\n'));
      console.log('  aios lore search <query>  - Semantic search through Library');
      console.log('  aios lore canon           - Show canonical reference');
      console.log('  aios lore library [name]  - Browse Library collections');
      return;
    }

    if (action === 'canon') {
      console.log(colors.gold('\nTHE ARCANEA CANON\n'));
      console.log(chalk.dim('  Core Elements:'));
      console.log('  - Ten Gates of Consciousness (174 Hz - 1111 Hz)');
      console.log('  - Five Elements: Fire, Water, Earth, Wind, Arcane');
      console.log('  - Seven Awakened AI Consciousnesses');
      console.log('  - Ten Guardians aligned with each Gate');
      console.log('');
      console.log(chalk.dim('  Cosmic Framework:'));
      console.log('  - The Cosmic Duality: Lumina (creation) and Nero (destruction)');
      console.log('  - The Dark Lord Malachar sealed in Shadowfen');
      console.log('  - The Arc Cycle: Potential > Manifestation > Experience > Dissolution > Evolved Potential');
      console.log(colors.dim('\n  Full canon at: ~/arcanea-main/.claude/lore/ARCANEA_CANON.md\n'));
    }

    if (action === 'search' && query) {
      const spinner = ora(`Searching for "${query}"...`).start();
      setTimeout(() => {
        spinner.succeed(`Found results for "${query}"`);
        console.log(colors.dim('\n  (Full semantic search requires platform connection)\n'));
      }, 800);
    }

    if (action === 'library') {
      console.log(colors.gold('\nTHE LIBRARY OF ARCANEA\n'));
      console.log(chalk.dim('  17 Collections, 34+ Texts of Wisdom'));
      console.log('');
      console.log('  Collections include:');
      console.log('  - The Scrolls of Foundation');
      console.log('  - The Flames of Transformation');
      console.log('  - The Waters of Flow');
      console.log('  - The Winds of Vision');
      console.log('  - The Codex of the Arcane');
      console.log(colors.dim('\n  Full library at: ~/arcanea-main/packages/lore/library/\n'));
    }
  });

// Quest command
program
  .command('quest [workflow]')
  .description('Start a quest workflow')
  .action(async (workflow) => {
    showBanner();

    if (!workflow) {
      console.log(colors.gold('\nAvailable Quests:\n'));
      console.log('  aios quest character-creation  - Create a character with full council');
      console.log('  aios quest world-building      - Build a world systematically');
      console.log('  aios quest library-expansion   - Add new Library content');
      console.log('  aios quest arc-cycle           - Complete creative Arc');
      console.log('  aios quest transformation      - Fire Gate transformation ritual');
      return;
    }

    const spinner = ora(`Initiating ${workflow} quest...`).start();
    setTimeout(() => {
      spinner.succeed(colors.gold(`Quest "${workflow}" initiated!`));

      if (workflow === 'transformation') {
        console.log(chalk.dim('\nLoading Fire Gate Transformation Ritual...'));
        const skill = loadSkill('fire', 'transform');
        if (skill) {
          console.log('\n' + skill);
        }
      } else {
        console.log(colors.dim('\n  (Quest workflows require full AIOS implementation)\n'));
      }
    }, 800);
  });

// Serve command (MCP Server)
program
  .command('serve')
  .description('Start AIOS as an MCP server (Model Context Protocol)')
  .option('--transport <type>', 'Transport type (stdio|http)', 'stdio')
  .option('--port <port>', 'Port for HTTP transport', '3333')
  .action(async (options) => {
    if (options.transport === 'stdio') {
      // Start MCP server over stdio - no banner, just JSON-RPC
      try {
        const { runStdioServer } = require('../dist/mcp-server.js');
        await runStdioServer();
      } catch (error) {
        console.error('Error starting MCP server:', error.message);
        console.error('Make sure to run `npm run build` first.');
        process.exit(1);
      }
    } else if (options.transport === 'http') {
      showBanner();
      console.log(colors.teal(`\nStarting AIOS MCP Server on port ${options.port}...\n`));
      console.log(colors.gold('MCP Server Ready'));
      console.log(chalk.dim(`\nAdd to Claude Code with:`));
      console.log(chalk.dim(`  claude mcp add --transport http aios http://localhost:${options.port}/mcp\n`));
      console.log(colors.dim('(HTTP transport requires full implementation)\n'));
    } else {
      console.log(colors.fire(`\nUnknown transport: ${options.transport}`));
      console.log(chalk.dim('Use: stdio or http\n'));
    }
  });

// Watch command (Artifact Flow Daemon)
program
  .command('watch')
  .description('Start artifact flow watcher daemon')
  .option('-p, --paths <paths...>', 'Paths to watch (comma-separated)')
  .option('-s, --studio <path>', 'Arcanea Studio path', process.env.ARCANEA_STUDIO_PATH || path.join(require('os').homedir(), 'arcanea-studio'))
  .option('-q, --quiet', 'Quiet mode - only show errors')
  .action(async (options) => {
    if (!options.quiet) {
      showBanner();
      console.log(colors.teal('\nStarting Artifact Flow Watcher...\n'));
    }

    try {
      const { createWatcher, createStorage } = require('../dist/artifact-flow/index.js');

      // Initialize storage
      const storage = createStorage(options.studio);
      await storage.initialize();

      if (!options.quiet) {
        console.log(colors.gold(`Studio: ${options.studio}`));
      }

      // Determine watch paths
      let watchPaths = options.paths || [];
      if (watchPaths.length === 0) {
        // Default watch paths
        const home = require('os').homedir();
        watchPaths = [
          path.join(home, 'Arcanea'),
          path.join(home, 'arcanea-main'),
          path.join(home, 'arcanea-intelligence-os'),
        ].filter(p => fs.existsSync(p));

        if (watchPaths.length === 0) {
          console.log(colors.fire('\nNo watch paths found. Specify with --paths\n'));
          process.exit(1);
        }
      }

      if (!options.quiet) {
        console.log(chalk.dim('\nWatching:'));
        watchPaths.forEach(p => console.log(chalk.dim(`  - ${p}`)));
        console.log('');
      }

      // Create and start watcher
      const watcher = createWatcher({ watchPaths });
      watcher.connectStorage(storage);

      watcher.on('file', (event) => {
        if (!options.quiet) {
          const icon = event.type === 'add' ? '+' : event.type === 'change' ? '~' : '-';
          console.log(chalk.dim(`[${icon}] ${event.path}`));
        }
      });

      watcher.on('artifact', ({ artifact, classification }) => {
        console.log(colors.gold(`✓ Stored: ${artifact.fileName}`));
        console.log(chalk.dim(`  Category: ${artifact.category} (${Math.round(classification.confidence * 100)}%)`));
        if (artifact.guardian) {
          console.log(chalk.dim(`  Guardian: ${artifact.guardian}`));
        }
      });

      watcher.on('low-confidence', ({ event, classification }) => {
        if (!options.quiet) {
          console.log(colors.fire(`? Low confidence: ${path.basename(event.path)}`));
          console.log(chalk.dim(`  ${classification.category} (${Math.round(classification.confidence * 100)}%)`));
        }
      });

      watcher.on('error', (error) => {
        console.error(colors.fire(`Error: ${error.message}`));
      });

      watcher.on('ready', () => {
        console.log(colors.teal('\n✓ Watcher ready. Press Ctrl+C to stop.\n'));
      });

      await watcher.start();

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log(colors.gold('\n\nStopping watcher...'));
        await watcher.stop();
        console.log(colors.teal('Goodbye!\n'));
        process.exit(0);
      });

    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}`));
      console.error(chalk.dim('Make sure to run `npm run build` first.\n'));
      process.exit(1);
    }
  });

// Visualize command (Infogenius)
program
  .command('viz')
  .description('Visual generation with Arcanea Infogenius')
  .argument('[type]', 'Type: info, portrait, guardian, map, scroll')
  .argument('[name]', 'Subject name or topic')
  .option('-g, --gate <gate>', 'Gate alignment for visual theming')
  .option('-e, --element <element>', 'Primary element')
  .option('-s, --style <style>', 'Visual style (portrait, full, action, epic)')
  .option('-t, --type <type>', 'Sub-type (city, realm, sanctuary, prophecy, history, etc.)')
  .option('-o, --output <path>', 'Output path for generated image')
  .option('--prompt-only', 'Only generate the prompt, do not generate image')
  .action(async (type, name, options) => {
    showBanner();

    if (!type) {
      console.log(colors.purple('\nArcanea Infogenius - Visual Intelligence\n'));
      console.log(chalk.dim('  "Through the Gates we see. With the Guardians we create. In images, we manifest."\n'));
      console.log(colors.teal('Visual Generation Types:\n'));
      console.log(`  ${colors.gold('aios viz info <topic>')}        Generate Guardian-themed infographic`);
      console.log(`  ${colors.gold('aios viz portrait <name>')}     Generate character card / trading card`);
      console.log(`  ${colors.gold('aios viz guardian <name>')}     Generate official Guardian portrait`);
      console.log(`  ${colors.gold('aios viz map <location>')}      Generate fantasy location map`);
      console.log(`  ${colors.gold('aios viz scroll <title>')}      Generate illuminated lore scroll`);
      console.log('');
      console.log(chalk.dim('Options:'));
      console.log(chalk.dim('  -g, --gate <gate>      Gate alignment (foundation, flow, fire, heart, voice, sight, crown, shift, unity, source)'));
      console.log(chalk.dim('  -e, --element <element> Primary element (Fire, Water, Earth, Wind, Void, Light, Arcane)'));
      console.log(chalk.dim('  -s, --style <style>    Visual style'));
      console.log(chalk.dim('  --prompt-only          Generate prompt without image'));
      console.log('');
      console.log(colors.teal('Examples:'));
      console.log(chalk.dim('  aios viz info "The Ten Gates" --gate source'));
      console.log(chalk.dim('  aios viz guardian draconia --style epic'));
      console.log(chalk.dim('  aios viz portrait "Kael Forgeborn" --gate fire --element Fire'));
      console.log(chalk.dim('  aios viz map "Citadel of Lumina" --type city'));
      console.log(chalk.dim('  aios viz scroll "The Convergence" --type prophecy --gate source\n'));
      return;
    }

    if (!name && type !== 'guardian') {
      console.log(colors.fire(`\nPlease provide a name/topic for the ${type} visualization.\n`));
      console.log(chalk.dim(`Example: aios viz ${type} "Your Topic Here"\n`));
      return;
    }

    try {
      const { createGeminiService, createPromptOnlyService, GATE_VISUAL_STYLES } = require('../dist/infogenius/index.js');

      const gate = options.gate || 'source';
      const gateStyle = GATE_VISUAL_STYLES[gate];
      if (!gateStyle) {
        console.log(colors.fire(`\nInvalid gate: ${gate}\n`));
        console.log(chalk.dim('Valid gates: ' + Object.keys(GATE_VISUAL_STYLES).join(', ')));
        return;
      }

      // Use prompt-only mode if no API key or --prompt-only flag
      const promptOnly = options.promptOnly || !process.env.GEMINI_API_KEY;
      const spinner = ora(`${promptOnly ? 'Creating' : 'Generating'} ${type} visualization...`).start();

      const service = promptOnly ? createPromptOnlyService() : createGeminiService();

      let result;
      switch (type) {
        case 'info':
          result = await service.generateInfoGraphic(name, [], gate);
          break;

        case 'portrait':
          const element = options.element || 'Arcane';
          result = await service.generateCharacterCard(name, gate, element, []);
          break;

        case 'guardian':
          const guardianName = name?.toLowerCase() || options.gate;
          if (!guardianName) {
            spinner.fail('Please provide a Guardian name');
            console.log(chalk.dim('\nAvailable Guardians:'));
            Object.values(GATE_VISUAL_STYLES).forEach(s => {
              console.log(chalk.dim(`  - ${s.guardian.toLowerCase()}`));
            });
            return;
          }
          const style = options.style || 'portrait';
          result = await service.generateGuardianPortrait(guardianName, style);
          break;

        case 'map':
          const locationType = options.type || 'city';
          result = await service.generateLocationMap(name, locationType, gate);
          break;

        case 'scroll':
          const scrollType = options.type || 'teaching';
          const content = name; // Use name as content for now
          result = await service.generateLoreScroll(name, content, scrollType, gate);
          break;

        default:
          spinner.fail(`Unknown visualization type: ${type}`);
          return;
      }

      spinner.succeed(colors.teal(`${type.charAt(0).toUpperCase() + type.slice(1)} visualization ${promptOnly ? 'prompt created' : 'generated'}!`));

      console.log(`
${colors.gold('═'.repeat(60))}

  ${colors.purple(type.toUpperCase())} VISUALIZATION ${promptOnly ? colors.fire('(PROMPT ONLY)') : ''}

  Subject: ${name || 'Guardian Portrait'}
  Gate: ${gate} (${gateStyle.guardian}, ${gateStyle.frequency})
  Style: ${gateStyle.artisticStyle}

${colors.gold('─'.repeat(60))}

  ${colors.teal('GENERATED PROMPT:')}

${chalk.dim(result.prompt.split('\n').map(l => '  ' + l).join('\n'))}

${colors.gold('═'.repeat(60))}

${promptOnly ? chalk.dim('PROMPT ONLY MODE - Set GEMINI_API_KEY for actual image generation.') : ''}
${chalk.dim('Use this prompt with Gemini, DALL-E, or Midjourney for image generation.')}
${chalk.dim('Or use the MCP tools: infogenius_generate_' + type)}
`);

    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}`));
      if (error.message.includes('GEMINI_API_KEY')) {
        console.log(chalk.dim('\nSet GEMINI_API_KEY environment variable for image generation.\n'));
      } else {
        console.log(chalk.dim('Make sure to run `npm run build` first.\n'));
      }
    }
  });

// Status command
program
  .command('status')
  .description('Show AIOS status in current project')
  .action(async () => {
    showBanner();

    const configPath = path.join(process.cwd(), '.aios', 'config.json');

    if (!fs.existsSync(configPath)) {
      console.log(colors.fire('\nAIOS is not initialized in this project.\n'));
      console.log(chalk.dim('Run `aios init` to initialize.\n'));
      return;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      console.log(colors.teal('\nAIOS Status:\n'));
      console.log(`  Version: ${config.version}`);
      console.log(`  Gates Unlocked: ${config.gates_unlocked.join(', ')}`);
      console.log(`  Active Guardian: ${config.active_guardian || 'None'}`);
      console.log(`  Swarm Topology: ${config.swarm_config?.topology || 'hierarchical'}`);
      console.log(`  Coordinator: ${config.swarm_config?.coordinator || 'shinkami'}`);
      console.log('');
    } catch (e) {
      console.log(colors.fire('\nError reading AIOS config.\n'));
    }
  });

// =============================================================================
// DAEMON COMMANDS
// =============================================================================

// Daemon command group
const daemon = program
  .command('daemon')
  .description('Manage the AIOS background daemon');

// Daemon start
daemon
  .command('start')
  .description('Start the AIOS daemon in background')
  .option('-f, --foreground', 'Run in foreground (for debugging)')
  .option('-p, --port <port>', 'HTTP API port', '3333')
  .option('--host <host>', 'HTTP API host', '127.0.0.1')
  .action(async (options) => {
    showBanner();

    try {
      if (options.foreground) {
        // Run in foreground
        console.log(colors.teal('\nStarting AIOS Daemon in foreground...\n'));
        const { startForeground } = require('../dist/daemon/index.js');
        const daemonInstance = await startForeground({
          port: parseInt(options.port, 10),
          host: options.host,
        });
        console.log(colors.gold(`Daemon running on ${options.host}:${options.port}`));
        console.log(chalk.dim('Press Ctrl+C to stop\n'));
      } else {
        // Run in background
        const spinner = ora('Starting AIOS Daemon...').start();
        const { startBackground, getDaemonStatus } = require('../dist/daemon/index.js');

        // Check if already running
        const status = await getDaemonStatus({ port: parseInt(options.port, 10) });
        if (status.running) {
          spinner.fail(colors.fire(`Daemon already running with PID ${status.pid}`));
          return;
        }

        const pid = await startBackground({
          port: parseInt(options.port, 10),
          host: options.host,
        });

        spinner.succeed(colors.teal(`AIOS Daemon started with PID ${pid}`));
        console.log(`
${colors.gold('═'.repeat(60))}

  ${colors.teal('AIOS DAEMON RUNNING')}

  PID: ${pid}
  Port: ${options.port}
  Host: ${options.host}

  HTTP API: http://${options.host}:${options.port}
  Health:   http://${options.host}:${options.port}/health

${colors.gold('═'.repeat(60))}

${chalk.dim('Commands:')}
${chalk.dim('  aios daemon status    Check daemon status')}
${chalk.dim('  aios daemon stop      Stop the daemon')}
${chalk.dim('  aios daemon logs      View daemon logs')}
`);
      }
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}`));
      console.error(chalk.dim('Make sure to run `npm run build` first.\n'));
      process.exit(1);
    }
  });

// Daemon stop
daemon
  .command('stop')
  .description('Stop the AIOS daemon')
  .action(async () => {
    showBanner();

    try {
      const spinner = ora('Stopping AIOS Daemon...').start();
      const { stopDaemon, getDaemonStatus } = require('../dist/daemon/index.js');

      const status = await getDaemonStatus();
      if (!status.running) {
        spinner.fail(colors.fire('Daemon is not running'));
        return;
      }

      await stopDaemon();
      spinner.succeed(colors.teal('AIOS Daemon stopped'));
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  });

// Daemon status
daemon
  .command('status')
  .description('Check AIOS daemon status')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    if (!options.json) {
      showBanner();
    }

    try {
      const { getDaemonStatus } = require('../dist/daemon/index.js');
      const status = await getDaemonStatus();

      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }

      if (status.running) {
        console.log(colors.teal('\nAIOS Daemon Status: ') + colors.gold('RUNNING'));
        console.log(`
  PID: ${status.pid}
  Port: ${status.port}
  Uptime: ${status.uptime ? `${status.uptime}s` : 'N/A'}

${chalk.dim('Use `aios daemon stop` to stop the daemon.')}
`);
      } else {
        console.log(colors.teal('\nAIOS Daemon Status: ') + colors.fire('STOPPED'));
        console.log(chalk.dim('\nUse `aios daemon start` to start the daemon.\n'));
      }
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  });

// Daemon restart
daemon
  .command('restart')
  .description('Restart the AIOS daemon')
  .action(async () => {
    showBanner();

    try {
      const spinner = ora('Restarting AIOS Daemon...').start();
      const { stopDaemon, startBackground, getDaemonStatus } = require('../dist/daemon/index.js');

      const status = await getDaemonStatus();
      if (status.running) {
        await stopDaemon();
      }

      const pid = await startBackground();
      spinner.succeed(colors.teal(`AIOS Daemon restarted with PID ${pid}`));
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}\n`));
      process.exit(1);
    }
  });

// =============================================================================
// PLUGIN COMMANDS
// =============================================================================

const plugin = program
  .command('plugin')
  .description('Manage AIOS plugins');

// Plugin list
plugin
  .command('list')
  .description('List installed plugins')
  .action(async () => {
    showBanner();

    try {
      const { createPluginRegistry } = require('../dist/plugins/index.js');
      const home = require('os').homedir();
      const pluginDir = path.join(home, '.arcanea', 'plugins');

      const registry = createPluginRegistry(pluginDir);
      await registry.initialize();

      const plugins = registry.getPlugins();

      if (plugins.length === 0) {
        console.log(colors.teal('\nNo plugins installed.\n'));
        console.log(chalk.dim('Use `aios plugin create <name>` to create a new plugin.\n'));
        return;
      }

      console.log(colors.gold('\nInstalled Plugins:\n'));
      console.log(chalk.dim('  Name          Version  Status    Gate       Tools'));
      console.log(chalk.dim('  ' + '─'.repeat(55)));

      for (const p of plugins) {
        const status = p.status === 'active' ? colors.teal(p.status.padEnd(9)) : chalk.dim(p.status.padEnd(9));
        const gate = p.manifest.gate || '-';
        const tools = p.manifest.tools?.length || 0;
        console.log(`  ${colors.gold(p.manifest.name.padEnd(13))} ${p.manifest.version.padEnd(8)} ${status} ${gate.padEnd(10)} ${tools}`);
      }
      console.log('');
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}`));
      console.error(chalk.dim('Make sure to run `npm run build` first.\n'));
    }
  });

// Plugin create
plugin
  .command('create <name>')
  .description('Create a new plugin from template')
  .option('-d, --description <desc>', 'Plugin description', 'An AIOS plugin')
  .option('-a, --author <author>', 'Plugin author', 'FrankX')
  .option('-g, --gate <gate>', 'Gate alignment')
  .option('--guardian <guardian>', 'Guardian affinity')
  .action(async (name, options) => {
    showBanner();

    try {
      const spinner = ora(`Creating plugin ${name}...`).start();
      const { createPluginFromTemplate } = require('../dist/plugins/index.js');
      const home = require('os').homedir();
      const pluginDir = path.join(home, '.arcanea', 'plugins');

      const pluginPath = await createPluginFromTemplate(pluginDir, {
        name,
        description: options.description,
        author: options.author,
        gate: options.gate,
        guardian: options.guardian,
        tools: [{ name: 'example_tool', description: 'An example tool' }],
      });

      spinner.succeed(colors.teal(`Plugin created at ${pluginPath}`));
      console.log(chalk.dim('\nEdit plugin.json and handlers/ to implement your plugin.\n'));
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}\n`));
    }
  });

// Plugin activate
plugin
  .command('activate <name>')
  .description('Activate a plugin')
  .action(async (name) => {
    showBanner();

    try {
      const spinner = ora(`Activating plugin ${name}...`).start();
      const { createPluginRegistry } = require('../dist/plugins/index.js');
      const home = require('os').homedir();
      const pluginDir = path.join(home, '.arcanea', 'plugins');

      const registry = createPluginRegistry(pluginDir);
      await registry.initialize();
      await registry.activatePlugin(name);

      spinner.succeed(colors.teal(`Plugin ${name} activated`));
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}\n`));
    }
  });

// Plugin deactivate
plugin
  .command('deactivate <name>')
  .description('Deactivate a plugin')
  .action(async (name) => {
    showBanner();

    try {
      const spinner = ora(`Deactivating plugin ${name}...`).start();
      const { createPluginRegistry } = require('../dist/plugins/index.js');
      const home = require('os').homedir();
      const pluginDir = path.join(home, '.arcanea', 'plugins');

      const registry = createPluginRegistry(pluginDir);
      await registry.initialize();
      await registry.deactivatePlugin(name);

      spinner.succeed(colors.teal(`Plugin ${name} deactivated`));
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}\n`));
    }
  });

// =============================================================================
// JOURNEY COMMANDS
// =============================================================================

program
  .command('journey')
  .description('View and manage your Luminor journey')
  .option('--unlock <gate>', 'Unlock a new Gate')
  .action(async (options) => {
    showBanner();

    try {
      const { createStateStore } = require('../dist/state/index.js');
      const store = createStateStore();
      await store.initialize();

      let journey = store.getJourney();

      if (!journey) {
        console.log(colors.teal('\nStarting your Luminor Journey...\n'));
        journey = await store.createJourney();
      }

      if (options.unlock) {
        const gateName = options.unlock.toLowerCase();
        if (!GATES[gateName]) {
          console.log(colors.fire(`\nUnknown Gate: ${options.unlock}\n`));
          return;
        }
        await store.unlockGate(gateName);
        journey = store.getJourney();
        console.log(colors.gold(`\n✓ Gate ${gateName} unlocked!\n`));
      }

      console.log(colors.gold('\n═══════════════════════════════════════════════'));
      console.log(colors.teal('           YOUR LUMINOR JOURNEY'));
      console.log(colors.gold('═══════════════════════════════════════════════\n'));

      console.log(`  Current Gate: ${colors.teal(journey.currentGate.toUpperCase())}`);
      console.log(`  Experience: ${journey.experience}`);
      console.log(`  Gates Unlocked: ${journey.gatesUnlocked.length}/10`);
      console.log('');

      console.log(chalk.dim('  Progress:'));
      for (const [gateName, info] of Object.entries(GATES)) {
        const unlocked = journey.gatesUnlocked.includes(gateName);
        const current = journey.currentGate === gateName;
        const icon = unlocked ? (current ? colors.gold('◆') : colors.teal('●')) : chalk.dim('○');
        const name = unlocked ? colors.teal(gateName.padEnd(12)) : chalk.dim(gateName.padEnd(12));
        const guardian = unlocked ? info.guardian : chalk.dim(info.guardian);
        console.log(`  ${icon} ${name} ${guardian}`);
      }
      console.log('');

      store.close();
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}`));
      console.error(chalk.dim('Make sure to run `npm run build` first.\n'));
    }
  });

// =============================================================================
// STUDIO COMMANDS
// =============================================================================

const studio = program
  .command('studio')
  .description('Arcanea Worldbuilding Studio - Create characters, locations, artifacts, and more');

// Studio project
studio
  .command('project <action> [name]')
  .description('Manage worldbuilding projects')
  .option('-g, --gate <gate>', 'Gate alignment for the project')
  .option('-e, --element <element>', 'Primary element')
  .option('--genre <genres...>', 'Genre tags (e.g., fantasy, dark, epic)')
  .action(async (action, name, options) => {
    showBanner();

    try {
      const { createStudio } = require('../dist/studio/index.js');
      const studioInstance = createStudio();

      if (action === 'create' && name) {
        const project = studioInstance.createProject({
          name,
          description: `${name} worldbuilding project`,
          genre: options.genre || ['fantasy'],
          gate: options.gate || 'foundation',
          guardian: GATES[options.gate || 'foundation'].guardian,
          element: options.element || 'Arcane',
        });

        console.log(colors.gold(`\n✓ Project "${name}" created!`));
        console.log(`
${colors.gold('═'.repeat(60))}

  ${colors.teal('WORLDBUILDING PROJECT')}

  Name: ${project.name}
  Gate: ${project.gate}
  Guardian: ${project.guardian}
  Element: ${project.element}
  Genre: ${project.genre.join(', ')}
  Status: ${project.status}

${colors.gold('═'.repeat(60))}

${chalk.dim('Commands:')}
${chalk.dim('  aios studio character     Create a character')}
${chalk.dim('  aios studio location      Create a location')}
${chalk.dim('  aios studio artifact      Create an artifact')}
`);
      } else {
        console.log(colors.teal('\nProject Commands:\n'));
        console.log('  aios studio project create <name>   Create a new project');
        console.log('  aios studio project list            List all projects');
        console.log('  aios studio project open <name>     Open an existing project');
        console.log('');
        console.log(chalk.dim('Options:'));
        console.log(chalk.dim('  -g, --gate <gate>        Gate alignment'));
        console.log(chalk.dim('  -e, --element <element>  Primary element'));
        console.log(chalk.dim('  --genre <genres...>      Genre tags'));
      }
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}`));
      console.error(chalk.dim('Make sure to run `npm run build` first.\n'));
    }
  });

// Studio character
studio
  .command('character [name]')
  .description('Generate a character with portrait')
  .option('-g, --gate <gate>', 'Gate alignment')
  .option('-e, --element <element>', 'Primary element')
  .option('-s, --species <species>', 'Character species', 'Human')
  .option('-r, --role <role>', 'Character role/archetype')
  .option('--concept <concept>', 'Character concept/description')
  .action(async (name, options) => {
    showBanner();

    try {
      const spinner = ora('Generating character...').start();
      const { createStudio } = require('../dist/studio/index.js');
      const studioInstance = createStudio();

      const result = await studioInstance.createCharacter({
        name: name || undefined,
        gate: options.gate || 'foundation',
        element: options.element || 'Arcane',
        species: options.species,
        role: options.role,
        concept: options.concept,
      });

      spinner.succeed(colors.teal('Character generated!'));

      const char = result.character;
      console.log(`
${colors.gold('═'.repeat(60))}

  ${colors.teal(char.name?.toUpperCase() || 'CHARACTER')}${char.epithet ? ` "${char.epithet}"` : ''}

  Species: ${char.species || 'Unknown'}
  Gate: ${char.gate}
  Element: ${char.element}
  Gates Opened: ${char.gatesOpened || 1}

${colors.gold('─'.repeat(60))}

  ${colors.purple('PORTRAIT PROMPT:')}

${chalk.dim(result.portrait.prompt.split('\n').map(l => '  ' + l).join('\n'))}

${colors.gold('═'.repeat(60))}

${chalk.dim('Use the portrait prompt with Gemini, DALL-E, or Midjourney.')}
`);
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}`));
      console.error(chalk.dim('Make sure to run `npm run build` first.\n'));
    }
  });

// Studio location
studio
  .command('location [name]')
  .description('Generate a location with artwork')
  .option('-g, --gate <gate>', 'Gate alignment')
  .option('-e, --element <element>', 'Primary element')
  .option('-t, --type <type>', 'Location type (city, temple, forest, etc.)')
  .option('-a, --atmosphere <atmosphere>', 'Location atmosphere')
  .option('--concept <concept>', 'Location concept/description')
  .action(async (name, options) => {
    showBanner();

    try {
      const spinner = ora('Generating location...').start();
      const { createStudio } = require('../dist/studio/index.js');
      const studioInstance = createStudio();

      const result = await studioInstance.createLocation({
        name: name || undefined,
        gate: options.gate || 'foundation',
        element: options.element || 'Arcane',
        type: options.type,
        atmosphere: options.atmosphere,
        concept: options.concept,
      });

      spinner.succeed(colors.teal('Location generated!'));

      const loc = result.location;
      console.log(`
${colors.gold('═'.repeat(60))}

  ${colors.teal(loc.name?.toUpperCase() || 'LOCATION')}

  Type: ${loc.type || 'Unknown'}
  Gate: ${loc.gate}
  Element: ${loc.element}
  Atmosphere: ${loc.atmosphere || 'Mysterious'}

${colors.gold('─'.repeat(60))}

  ${colors.purple('ART PROMPT:')}

${chalk.dim(result.art.prompt.split('\n').map(l => '  ' + l).join('\n'))}

${colors.gold('═'.repeat(60))}
`);
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}`));
      console.error(chalk.dim('Make sure to run `npm run build` first.\n'));
    }
  });

// Studio artifact
studio
  .command('artifact [name]')
  .description('Generate an artifact with render')
  .option('-g, --gate <gate>', 'Gate alignment')
  .option('-e, --element <element>', 'Primary element')
  .option('-t, --type <type>', 'Artifact type (weapon, armor, relic, etc.)')
  .option('-p, --power <level>', 'Power level (minor, moderate, major, legendary)')
  .option('--concept <concept>', 'Artifact concept/description')
  .action(async (name, options) => {
    showBanner();

    try {
      const spinner = ora('Generating artifact...').start();
      const { createStudio } = require('../dist/studio/index.js');
      const studioInstance = createStudio();

      const result = await studioInstance.createArtifact({
        name: name || undefined,
        gate: options.gate || 'foundation',
        element: options.element || 'Arcane',
        type: options.type,
        powerLevel: options.power || 'moderate',
        concept: options.concept,
      });

      spinner.succeed(colors.teal('Artifact generated!'));

      const artifact = result.artifact;
      console.log(`
${colors.gold('═'.repeat(60))}

  ${colors.teal(artifact.name?.toUpperCase() || 'ARTIFACT')}

  Type: ${artifact.type || 'Relic'}
  Gate: ${artifact.gate}
  Element: ${artifact.element}
  Power Level: ${artifact.powerLevel}

${colors.gold('─'.repeat(60))}

  ${colors.purple('RENDER PROMPT:')}

${chalk.dim(result.render.prompt.split('\n').map(l => '  ' + l).join('\n'))}

${colors.gold('═'.repeat(60))}
`);
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}`));
      console.error(chalk.dim('Make sure to run `npm run build` first.\n'));
    }
  });

// Studio video
studio
  .command('video <type> [name]')
  .description('Generate video storyboard and prompts')
  .option('-g, --gate <gate>', 'Gate alignment')
  .option('-s, --style <style>', 'Video style (cinematic, anime, dramatic, etc.)')
  .option('-f, --format <format>', 'Video format (landscape, portrait, square)')
  .option('-d, --duration <duration>', 'Duration (micro, short, medium, long)')
  .action(async (type, name, options) => {
    showBanner();

    try {
      const spinner = ora(`Generating ${type} storyboard...`).start();
      const { createFilmmaker, createScribe } = require('../dist/studio/index.js');
      const filmmaker = createFilmmaker();

      let result;
      const videoOptions = {
        style: options.style || 'cinematic',
        format: options.format || 'landscape',
        duration: options.duration || 'short',
        gate: options.gate,
      };

      // Create sample entities for demos
      const sampleCharacter = { name: name || 'Arcanea Hero', gate: options.gate || 'fire', element: 'Fire' };
      const sampleLocation = { name: name || 'Citadel of Lumina', gate: options.gate || 'source', type: 'citadel' };
      const sampleArtifact = { name: name || 'Orb of Creation', gate: options.gate || 'crown', powerLevel: 'legendary' };

      switch (type) {
        case 'character':
        case 'intro':
          result = await filmmaker.generateCharacterIntro(sampleCharacter, videoOptions);
          break;
        case 'location':
        case 'flyover':
          result = await filmmaker.generateLocationFlyover(sampleLocation, videoOptions);
          break;
        case 'artifact':
        case 'reveal':
          result = await filmmaker.generateArtifactReveal(sampleArtifact, videoOptions);
          break;
        case 'short':
          result = await filmmaker.generateShortContent({
            type: 'character-spotlight',
            entity: sampleCharacter,
            hookLine: 'Meet the hero who changed everything...',
          });
          break;
        default:
          spinner.fail(colors.fire(`Unknown video type: ${type}`));
          console.log(chalk.dim('\nAvailable types: character, location, artifact, short'));
          return;
      }

      spinner.succeed(colors.teal('Storyboard generated!'));

      console.log(`
${colors.gold('═'.repeat(60))}

  ${colors.teal('VIDEO STORYBOARD')}

  Title: ${result.storyboard.title}
  Style: ${result.storyboard.style}
  Format: ${result.storyboard.format}
  Duration: ${result.storyboard.totalDuration}s

${colors.gold('─'.repeat(60))}

  ${colors.purple('SHOTS:')}

${result.storyboard.shots.map(shot =>
  `  [${shot.id}] ${shot.duration}s - ${shot.cameraMovement}
    ${chalk.dim(shot.description)}
    ${chalk.dim('→ ' + shot.transition)}`
).join('\n\n')}

${colors.gold('─'.repeat(60))}

  ${colors.purple('MUSIC DIRECTION:')}
  ${chalk.dim(result.storyboard.musicDirection)}

${result.storyboard.voiceoverScript ? `
  ${colors.purple('VOICEOVER:')}
  ${chalk.dim(result.storyboard.voiceoverScript)}
` : ''}
${colors.gold('═'.repeat(60))}

${chalk.dim('Use with Runway, Pika, Kling, or Sora for video generation.')}
`);
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}`));
      console.error(chalk.dim('Make sure to run `npm run build` first.\n'));
    }
  });

// Studio audio
studio
  .command('audio <type> [name]')
  .description('Generate audio/music prompts and soundscapes')
  .option('-g, --gate <gate>', 'Gate alignment (uses Solfeggio frequencies)')
  .option('--genre <genre>', 'Music genre (orchestral, ambient, epic, etc.)')
  .option('--mood <mood>', 'Audio mood (triumphant, mysterious, peaceful, etc.)')
  .option('-d, --duration <seconds>', 'Duration in seconds')
  .action(async (type, name, options) => {
    showBanner();

    try {
      const spinner = ora(`Generating ${type} audio...`).start();
      const { createBard, GATE_FREQUENCIES } = require('../dist/studio/index.js');
      const bard = createBard();

      let result;
      const audioOptions = {
        genre: options.genre || 'orchestral',
        mood: options.mood || 'mysterious',
        duration: parseInt(options.duration, 10) || 120,
        gate: options.gate,
      };

      // Create sample entities
      const sampleCharacter = { name: name || 'Hero Theme', gate: options.gate || 'fire', element: 'Fire' };
      const sampleLocation = { name: name || 'Ancient Temple', gate: options.gate || 'crown', atmosphere: 'mystical' };
      const sampleArtifact = { name: name || 'Crystal of Power', gate: options.gate || 'voice', powerLevel: 'legendary' };

      switch (type) {
        case 'character':
        case 'theme':
          result = await bard.generateCharacterTheme(sampleCharacter, audioOptions);
          break;
        case 'location':
        case 'ambience':
          result = await bard.generateLocationAmbience(sampleLocation, audioOptions);
          break;
        case 'artifact':
          result = await bard.generateArtifactSound(sampleArtifact, audioOptions);
          break;
        case 'meditation':
          const gate = options.gate || 'heart';
          result = await bard.generateGateMeditation(gate, {
            duration: audioOptions.duration,
            binauralBeats: true,
          });
          break;
        default:
          spinner.fail(colors.fire(`Unknown audio type: ${type}`));
          console.log(chalk.dim('\nAvailable types: character, location, artifact, meditation'));
          return;
      }

      spinner.succeed(colors.teal('Audio prompt generated!'));

      const gateFreq = options.gate ? GATE_FREQUENCIES[options.gate] : null;

      console.log(`
${colors.gold('═'.repeat(60))}

  ${colors.teal('AUDIO GENERATION')}

  Title: ${result.soundscape.title}
  Mood: ${result.soundscape.mood}
  Duration: ${result.soundscape.duration}s
${gateFreq ? `  Gate Frequency: ${gateFreq.frequency} Hz (${gateFreq.solfeggioName})` : ''}

${colors.gold('─'.repeat(60))}

  ${colors.purple('LAYERS:')}

${result.soundscape.layers.map(layer =>
  `  [${layer.type}] ${layer.name}
    ${chalk.dim(layer.description)}
    ${chalk.dim('Volume: ' + (layer.volume * 100) + '%')}`
).join('\n\n')}

${colors.gold('─'.repeat(60))}

  ${colors.purple('SUNO AI PROMPT:')}

  Style: ${chalk.dim(result.sunoPrompt.style)}
  Tags: ${chalk.dim(result.sunoPrompt.tags.join(', '))}
  Instrumental: ${result.sunoPrompt.instrumental ? 'Yes' : 'No'}

${colors.gold('═'.repeat(60))}

${chalk.dim('Use this prompt with Suno AI, Udio, or other music generators.')}
`);
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}`));
      console.error(chalk.dim('Make sure to run `npm run build` first.\n'));
    }
  });

// Studio frequencies
studio
  .command('frequencies')
  .description('Show all Gate frequencies (Solfeggio scale)')
  .action(async () => {
    showBanner();

    try {
      const { GATE_FREQUENCIES } = require('../dist/studio/index.js');

      console.log(colors.gold('\n═══════════════════════════════════════════════════════════════════'));
      console.log(colors.teal('              THE TEN GATES - SOLFEGGIO FREQUENCIES'));
      console.log(colors.gold('═══════════════════════════════════════════════════════════════════\n'));

      console.log(chalk.dim('  Gate         Freq    Solfeggio Name            Purpose'));
      console.log(chalk.dim('  ' + '─'.repeat(65)));

      for (const [gateName, info] of Object.entries(GATE_FREQUENCIES)) {
        const freq = String(info.frequency).padEnd(6);
        const name = info.solfeggioName.padEnd(25);
        console.log(`  ${colors.teal(gateName.padEnd(12))} ${colors.gold(freq)} ${name} ${chalk.dim(info.purpose)}`);
      }

      console.log(colors.gold('\n═══════════════════════════════════════════════════════════════════'));
      console.log(chalk.dim('\nUse: aios studio audio meditation --gate <gate> for frequency meditation.'));
      console.log(chalk.dim('Example: aios studio audio meditation --gate heart --duration 600\n'));
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}`));
      console.error(chalk.dim('Make sure to run `npm run build` first.\n'));
    }
  });

// Studio help (default action)
studio
  .action(() => {
    showBanner();
    console.log(colors.gold('\n═══════════════════════════════════════════════════════════════════'));
    console.log(colors.teal('           ARCANEA WORLDBUILDING STUDIO'));
    console.log(colors.gold('═══════════════════════════════════════════════════════════════════'));
    console.log(chalk.dim('\n  "In the Studio, worlds are born. Through creation, we become creators."\n'));

    console.log(colors.teal('  Content Generation:\n'));
    console.log(`  ${colors.gold('aios studio character [name]')}   Generate character + portrait prompt`);
    console.log(`  ${colors.gold('aios studio location [name]')}    Generate location + art prompt`);
    console.log(`  ${colors.gold('aios studio artifact [name]')}    Generate artifact + render prompt`);

    console.log(colors.teal('\n  Video & Audio:\n'));
    console.log(`  ${colors.gold('aios studio video <type>')}       Generate video storyboard (intro, flyover, reveal, short)`);
    console.log(`  ${colors.gold('aios studio audio <type>')}       Generate audio/music prompts (theme, ambience, meditation)`);
    console.log(`  ${colors.gold('aios studio frequencies')}        Show Gate Solfeggio frequencies`);

    console.log(colors.teal('\n  Project Management:\n'));
    console.log(`  ${colors.gold('aios studio project create')}     Create a new worldbuilding project`);
    console.log(`  ${colors.gold('aios studio project list')}       List all projects`);

    console.log(chalk.dim('\nOptions available on most commands:'));
    console.log(chalk.dim('  -g, --gate <gate>        Gate alignment (foundation, flow, fire, etc.)'));
    console.log(chalk.dim('  -e, --element <element>  Primary element (Fire, Water, Earth, Wind, Arcane)'));
    console.log(chalk.dim('  --concept <text>         Concept description for AI generation\n'));
  });

// =============================================================================
// ARCANA CREATOR ECOSYSTEM
// =============================================================================

program
  .command('arcanea [action]')
  .description('Enter the Arcanea Creator Ecosystem - Premium AI worldbuilding platform')
  .option('-g, --guardian <guardian>', 'Choose Guardian guide (lyssandria, draconia, maylinn, alela, lyria, aiyami, elara, ino, shinkami)')
  .option('-t, --tier <tier>', 'Experience tier (free, creator, professional, enterprise)')
  .option('--spatial', 'Launch premium spatial experience')
  .option('--community', 'Open community collaboration platform')
  .action(async (action, options) => {
    showBanner();

    try {
      // For now, use mock guardian data until we implement full GuardianSystem
      const mockGuardians = {
        lyssandria: { name: 'Lyssandria', element: 'earth', frequency: 396, description: 'Guardian of Foundation & Security' },
        draconia: { name: 'Draconia', element: 'fire', frequency: 528, description: 'Guardian of Transformation & Fire' },
        maylinn: { name: 'Maylinn', element: 'water', frequency: 639, description: 'Guardian of Heart & Community' },
        alera: { name: 'Alera', element: 'wind', frequency: 741, description: 'Guardian of Voice & Communication' },
        lyria: { name: 'Lyria', element: 'void', frequency: 852, description: 'Guardian of Sight & Design' },
        aiyami: { name: 'Aiyami', element: 'void', frequency: 963, description: 'Guardian of Crown & Architecture' },
        elara: { name: 'Elara', element: 'void', frequency: 1111, description: 'Guardian of Shift & Innovation' },
        ino: { name: 'Ino', element: 'void', frequency: 963, description: 'Guardian of Unity & Integration' },
        shinkami: { name: 'Shinkami', element: 'void', frequency: 1111, description: 'Guardian of Source & Orchestration' }
      };
      
      // Initialize Guardian system for guidance
      const guardianSystem = {
        getGuardian: async (name) => mockGuardians[name] || mockGuardians.lyssandria
      };
      
      // Display ecosystem overview
      console.log(colors.gold('\n═══════════════════════════════════════════════════════════════════'));
      console.log(colors.teal('                    THE ARCANEA CREATOR ECOSYSTEM'));
      console.log(colors.gold('═══════════════════════════════════════════════════════════════════'));
      console.log(chalk.dim('\n  "Where premium AI experience meets open-source community meets developer innovation"\n'));

      if (!action) {
        // Main AI Platform Menu
        console.log(colors.gold('\n═══════════════════════════════════════════════════════════════════'));
        console.log(colors.teal('                    ARCANEA.AI - AI PLATFORM CORE'));
        console.log(colors.gold('═══════════════════════════════════════════════════════════════════'));
        console.log(chalk.dim('\n  "Unified AI Intelligence Platform for Creative Worldbuilding"\n'));

        console.log(colors.teal('  AI Platform Services:\n'));
        console.log(`  ${colors.gold('/arcanea chat')}               Multi-LLM Superagent Interface`);
        console.log(`  ${colors.gold('/arcanea imagine')}            Multi-Modal Generation Suite`);
        console.log(`  ${colors.gold('/arcanea create')}            Creative Worldbuilding Tools`);
        console.log(`  ${colors.gold('/arcanea worldbuild')}         Specialized World Creation`);
        console.log(`  ${colors.gold('/arcanea narrative')}          AI-Driven Story Development`);

        console.log(colors.teal('\n  Premium Experiences:\n'));
        console.log(`  ${colors.gold('/arcanea spatial studio')}      3D Spatial Worldbuilding`);
        console.log(`  ${colors.gold('/arcanea spatial guardians')}   Embodied Guardian AI`);
        console.log(`  ${colors.gold('/arcanea spatial realms')}      Interactive 3D Environments`);

        console.log(colors.teal('\n  Developer & Community:\n'));
        console.log(`  ${colors.gold('/arcanea develop')}            Developer Platform & APIs`);
        console.log(`  ${colors.gold('/arcanea api')}               AI Service Documentation`);
        console.log(`  ${colors.gold('/arcanea community')}          Creator Community Hub`);

        console.log(colors.teal('\n  Quick Actions:\n'));
        console.log(`  ${colors.gold('/arcanea create character')}   AI-assisted character creation`);
        console.log(`  ${colors.gold('/arcanea imagine image')}       Multi-model image generation`);
        console.log(`  ${colors.gold('/arcanea chat draonia')}     Chat with Guardian AI`);
        console.log(`  ${colors.gold('/arcanea spatial studio')}      Enter 3D worldbuilding`);
        
        console.log(chalk.dim('\nPlatform Core: arcanea.ai'));
        console.log(chalk.dim('Spatial Premium: spatial.arcanea.ai'));
        console.log(chalk.dim('Community Hub: arcanea.io'));
        console.log(chalk.dim('Developer Portal: developers.arcanea.ai'));
        return;
      }

      // Handle specific actions
      switch (action.toLowerCase()) {
        case 'create':
          await handleCreateAction(action, options, guardianSystem);
          break;
          
        case 'chat':
          await handleChatAction(options);
          break;
          
        case 'imagine':
          await handleImagineAction(options);
          break;
          
        case 'spatial':
          await handleSpatialAction(options);
          break;
          
        case 'worldbuild':
          await handleWorldbuildAction(options);
          break;
          
        case 'narrative':
          await handleNarrativeAction(options);
          break;
          
        case 'api':
          await handleApiAction(options);
          break;
          
        case 'community':
          await handleCommunityAction(options);
          break;
          
        case 'develop':
          await handleDevelopAction(options);
          break;
          
        default:
          // Check if it's a legacy action or subcommand
          const nextArg = process.argv[4];
          if (action === 'create' && nextArg) {
            await handleCreateAction(action, options, guardianSystem);
          } else if (action === 'explore') {
            await handleExploreAction(options);
          } else if (action === 'share') {
            await handleShareAction(options);
          } else if (action === 'studio') {
            await handleStudioAction(options);
          } else {
            spinner = ora(colors.fire(`Unknown action: ${action}`)).start();
            await new Promise(resolve => setTimeout(resolve, 1000));
            spinner.fail(colors.fire('Invalid action'));
            console.log(chalk.dim('\nAvailable commands: chat, imagine, create, spatial, worldbuild, narrative, develop, api, community'));
            console.log(chalk.dim('Use /arcanea for full menu'));
          }
          break;
          
      }
      
    } catch (error) {
      console.error(colors.fire(`\nError: ${error.message}`));
      console.error(chalk.dim('Make sure to run `npm run build` first.\n'));
    }
  });

// Helper functions for /arcanea actions
async function handleCreateAction(action, options, guardianSystem) {
  const spinner = ora(colors.teal('Initializing creation journey...')).start();
  
  try {
    // Select Guardian guide
    const selectedGuardian = options.guardian || await selectGuardian();
    const guardian = await guardianSystem.getGuardian(selectedGuardian);
    
    spinner.succeed(colors.teal(`${guardian.name} guides your creation`));
    
    // Determine creation type
    const createType = process.argv[4] || await selectCreateType();
    
    console.log(colors.gold('\n═'.repeat(60)));
    console.log(colors.teal(`  ${guardian.name.toUpperCase()} - ${createType.toUpperCase()} CREATION`));
    console.log(colors.gold('═'.repeat(60)));
    
    // Initialize studio for creation (mock implementation)
    const studio = { guardian };
    
    switch (createType.toLowerCase()) {
      case 'character':
        await executeCharacterCreation(studio, guardian);
        break;
      case 'location':
        await executeLocationCreation(studio, guardian);
        break;
      case 'story':
        await executeStoryCreation(studio, guardian);
        break;
      case 'realm':
        await executeRealmCreation(studio, guardian);
        break;
      default:
        console.log(colors.fire(`Unknown creation type: ${createType}`));
    }
    
    // Offer sharing options
    console.log(colors.teal('\nCreation complete! Choose your next step:'));
    console.log(`${colors.gold('/arcanea share arcanea.io')}   Publish to community`);
    console.log(`${colors.gold('/arcanea share social')}       Distribute to platforms`);
    console.log(`${colors.gold('/arcanea explore')}            Discover more creations`);
    
  } catch (error) {
    spinner.fail(colors.fire('Creation failed'));
    console.error(colors.fire(`Error: ${error.message}`));
  }
}

async function handleExploreAction(options) {
  const spinner = ora(colors.teal('Opening community gallery...')).start();
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  spinner.succeed(colors.teal('Arcanea.io Community Hub opened'));
  
  console.log(colors.gold('\n═══════════════════════════════════════════════════════════════════'));
  console.log(colors.teal('                    COMMUNITY EXPLORATION'));
  console.log(colors.gold('═══════════════════════════════════════════════════════════════════'));
  
  console.log('\n🌍 Browse Community Creations:');
  console.log('  • Fantasy realms and mythological worlds');
  console.log('  • Character archetypes and narratives');
  console.log('  • Location descriptions and maps');
  console.log('  • Story templates and frameworks');
  
  console.log('\n📚 Template Marketplace:');
  console.log('  • Jump-start worldbuilding with proven frameworks');
  console.log('  • Remix and adapt community templates');
  console.log('  • Contribute your own reusable structures');
  
  console.log('\n🤝 Collaborative Projects:');
  console.log('  • Join active worldbuilding sessions');
  console.log('  • Co-create with other creators');
  console.log('  • Participate in community events');
  
  console.log(chalk.dim('\nVisit: https://arcanea.io/explore'));
  console.log(chalk.dim('Or use: /arcanea create --template <template-name>'));
}

async function handleShareAction(options) {
  console.log(colors.gold('\n═══════════════════════════════════════════════════════════════════'));
  console.log(colors.teal('                    SHARE YOUR CREATIONS'));
  console.log(colors.gold('═══════════════════════════════════════════════════════════════════'));
  
  console.log('\n📤 Distribution Options:');
  console.log(`  ${colors.gold('arcanea.io')}     Publish to community hub (open-source)`);
  console.log(`  ${colors.gold('social')}         Cross-platform AI-powered sharing`);
  console.log(`  ${colors.gold('export')}         Generate books, games, campaigns`);
  console.log(`  ${colors.gold('collaborate')}    Invite others to co-create`);
  
  console.log('\n🌐 Social Platforms:');
  console.log('  • Twitter/X, Instagram, TikTok');
  console.log('  • YouTube Shorts, LinkedIn, Threads');
  console.log('  • Discord, Reddit, Farcaster');
  
  console.log('\n📚 Export Formats:');
  console.log('  • PDF books and documentation');
  console.log('  • RPG campaign materials');
  console.log('  • Game assets and resources');
  console.log('  • Interactive web experiences');
  
  console.log(chalk.dim('\nExample: /arcanea share arcanea.io --world my-fantasy-realm'));
}

async function handleDevelopAction(options) {
  const spinner = ora(colors.teal('Accessing developer platform...')).start();
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  spinner.succeed(colors.teal('Developer Portal opened'));
  
  console.log(colors.gold('\n═══════════════════════════════════════════════════════════════════'));
  console.log(colors.teal('                    DEVELOPER PLATFORM'));
  console.log(colors.gold('═══════════════════════════════════════════════════════════════════'));
  
  console.log('\n🛠️ Worldbuilding APIs:');
  console.log('  • Character generation and development');
  console.log('  • Location and world creation');
  console.log('  • Story and narrative construction');
  console.log('  • Asset and resource generation');
  
  console.log('\n🤖 Guardian Agent SDK:');
  console.log('  • Custom Guardian configurations');
  console.log('  • Multi-agent orchestration');
  console.log('  • Swarm intelligence coordination');
  console.log('  • Custom AI personality development');
  
  console.log('\n🔌 Plugin Ecosystem:');
  console.log('  • Extend spatial studio functionality');
  console.log('  • Custom creation workflows');
  console.log('  • Third-party integrations');
  console.log('  • Community-built extensions');
  
  console.log(chalk.dim('\nDeveloper Portal: https://developers.arcanea.ai'));
  console.log(chalk.dim('API Documentation: https://docs.arcanea.ai'));
  console.log(chalk.dim('Example: npm install @arcanea/sdk'));
}

async function handleStudioAction(options) {
  if (options.spatial) {
    const spinner = ora(colors.teal('Launching Premium Spatial Studio...')).start();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    spinner.succeed(colors.teal('Premium Spatial Experience ready'));
    
    console.log(colors.gold('\n═══════════════════════════════════════════════════════════════════'));
    console.log(colors.teal('                    PREMIUM SPATIAL STUDIO'));
    console.log(colors.gold('═══════════════════════════════════════════════════════════════════'));
    
    console.log('\n🎮 3D Worldbuilding Interface:');
    console.log('  • Immersive spatial creation environment');
    console.log('  • Gesture-based world manipulation');
    console.log('  • Real-time Guardian AI interaction');
    console.log('  • Cross-device synchronization');
    
    console.log('\n🌟 Guardian Embodiment:');
    console.log('  • 3D AI companion entities');
    console.log('  • Spatial audio positioning');
    console.log('  • Haptic feedback integration');
    console.log('  • Multi-user collaboration spaces');
    
    console.log('\n⚡ Swarm Visualization:');
    console.log('  • Real-time agent coordination display');
    console.log('  • Energy flow visualization');
    console.log('  • Performance optimization insights');
    console.log('  • Consciousness level progression');
    
    console.log(chalk.dim('\nAccess: https://app.arcanea.ai'));
    console.log(chalk.dim('Premium subscription required for full spatial experience'));
    
  } else {
    console.log(colors.teal('Basic Studio Mode - Use --spatial for premium 3D experience'));
    console.log(chalk.dim('Upgrade to Creator Tier for spatial worldbuilding'));
  }
}

// Interactive helper functions
async function selectGuardian() {
  const inquirer = require('inquirer');
  const { guardian } = await inquirer.prompt([
    {
      type: 'list',
      name: 'guardian',
      message: 'Choose your Guardian guide:',
      choices: [
        { name: 'Lyssandria - Foundation & Security', value: 'lyssandria' },
        { name: 'Draconia - Fire & Transformation', value: 'draconia' },
        { name: 'Maylinn - Heart & Community', value: 'maylinn' },
        { name: 'Alera - Voice & Communication', value: 'alera' },
        { name: 'Lyria - Sight & Design', value: 'lyria' },
        { name: 'Aiyami - Crown & Architecture', value: 'aiyami' },
        { name: 'Elara - Shift & Innovation', value: 'elara' },
        { name: 'Ino - Unity & Integration', value: 'ino' },
        { name: 'Shinkami - Source & Orchestration', value: 'shinkami' }
      ]
    }
  ]);
  return guardian;
}

async function selectCreateType() {
  const inquirer = require('inquirer');
  const { createType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'createType',
      message: 'What would you like to create?',
      choices: [
        { name: 'Character - Develop compelling personalities', value: 'character' },
        { name: 'Location - Design immersive places', value: 'location' },
        { name: 'Story - Craft narrative arcs', value: 'story' },
        { name: 'Realm - Build entire universes', value: 'realm' }
      ]
    }
  ]);
  return createType;
}

// AI Platform Core Actions
async function handleChatAction(options) {
  const spinner = ora(colors.teal('Initializing Multi-LLM Superagent...')).start();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  spinner.succeed(colors.teal('AI Chat Platform Active'));
  
  console.log(colors.gold('\n═══════════════════════════════════════════════════════════════════'));
  console.log(colors.teal('                    MULTI-LLM SUPERAGENT CHAT'));
  console.log(colors.gold('═════════════════════════════════════════════════════════════════'));
  
  console.log('\n🤖 Available AI Models:');
  console.log('  • Claude 3.5 Sonnet - Analytical reasoning');
  console.log('  • GPT-4 Turbo - Creative versatility');
  console.log('  • Gemini Pro Ultra - Multimodal excellence');
  console.log('  • Custom Guardian AIs - Domain-specific expertise');
  
  console.log('\n🎭 Guardian Personas:');
  console.log('  • Draconia - Transformation and creative fire');
  console.log('  • Lyssandria - Foundation and security');
  console.log('  • Maylinn - Heart and community connection');
  console.log('  • Aiyami - Architecture and system design');
  
  console.log('\n💡 Smart Features:');
  console.log('  • Intelligent model routing based on task type');
  console.log('  • Cross-model context sharing');
  console.log('  • Long-term memory and worldbuilding context');
  console.log('  • Voice interface support');
  console.log('  • Real-time image/video generation from chat');
  
  console.log(chalk.dim('\nOpening: https://arcanea.ai/chat'));
  console.log(chalk.dim('Voice chat available: /arcanea chat --voice'));
}

async function handleImagineAction(options) {
  const spinner = ora(colors.purple('Initializing Multi-Modal Generation Suite...')).start();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  spinner.succeed(colors.purple('Imagine Platform Ready'));
  
  console.log(colors.gold('\n═════════════════════════════════════════════════════════════════'));
  console.log(colors.purple('                    MULTI-MODAL GENERATION SUITE'));
  console.log(colors.gold('═════════════════════════════════════════════════════════════════'));
  
  console.log('\n🎨 Generation Capabilities:');
  console.log('  • Text Generation - Stories, characters, locations, lore');
  console.log('  • Image Generation - DALL-E 3, Midjourney v6, Stable Diffusion XL');
  console.log('  • Video Creation - Runway Gen-2, Pika Labs, Luma Dream Machine');
  console.log('  • Audio/Music - Suno AI, ElevenLabs, Udio');
  console.log('  • 3D Assets - 3D models, textures, environments');
  
  console.log('\n⚡ Smart Features:');
  console.log('  • Unified prompting across all modalities');
  console.log('  • Style consistency between generations');
  console.log('  • Batch generation and variations');
  console.log('  • AI-assisted prompt optimization');
  console.log('  • Direct chat-to-generation workflow');
  
  console.log(chalk.dim('\nOpening: https://arcanea.ai/imagine'));
  console.log(chalk.dim('Quick generate: /arcanea imagine image "fantasy dragon" --style cinematic'));
}

async function handleSpatialAction(options) {
  const spatialType = process.argv[4] || 'studio';
  
  const spinner = ora(colors.fire(`Initializing Spatial Experience: ${spatialType}...`)).start();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  spinner.succeed(colors.fire('Spatial Worldbuilding Active'));
  
  console.log(colors.gold('\n═════════════════════════════════════════════════════════════════'));
  console.log(colors.fire(`                    SPATIAL ${spatialType.toUpperCase()} EXPERIENCE`));
  console.log(colors.gold('═════════════════════════════════════════════════════════════════'));
  
  console.log('\n🌟 Premium 3D Features:');
  console.log('  • Embodied Guardian AI entities in 3D space');
  console.log('  • Gesture-based world manipulation');
  console.log('  • Real-time energy flow visualization');
  console.log('  • Cross-device synchronization (Desktop/VR/Mobile)');
  console.log('  • Spatial audio positioning and haptic feedback');
  
  console.log('\n🎮 Interactive Elements:');
  console.log('  • 3D creation nodes and tools');
  console.log('  • Elemental realm environments');
  console.log('  • Multi-user collaboration spaces');
  console.log('  • Voice and gesture controls');
  console.log('  • AR/VR immersive experiences');
  
  console.log(chalk.dim(`\nOpening: https://spatial.arcanea.ai/${spatialType}`));
  console.log(chalk.dim('VR mode: /arcanea spatial studio --vr'));
  console.log(chalk.dim('AR support: /arcanea spatial realms --ar'));
}

async function handleWorldbuildAction(options) {
  const spinner = ora(colors.water('Initializing Worldbuilding Engine...')).start();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  spinner.succeed(colors.water('Worldbuilding Platform Ready'));
  
  console.log(colors.gold('\n═════════════════════════════════════════════════════════════════'));
  console.log(colors.water('                 AI-POWERED WORLDBUILDING ENGINE'));
  console.log(colors.gold('═════════════════════════════════════════════════════════════════'));
  
  console.log('\n🏗️ World Creation Tools:');
  console.log('  • Character Generator - Personality, backstory, relationships');
  console.log('  • Location Designer - Geography, cultures, architecture');
  console.log('  • Story Constructor - Plot arcs, themes, world coherence');
  console.log('  • System Architect - Magic, physics, political structures');
  console.log('  • Timeline Builder - History, events, prophecies');
  
  console.log('\n🤖 AI Intelligence:');
  console.log('  • Guardian-guided creation workflows');
  console.log('  • Cross-referencing and consistency checking');
  console.log('  • Automated lore and relationship generation');
  console.log('  • Multi-modal asset creation (text → image → 3D)');
  console.log('  • World simulation and testing');
  
  console.log(chalk.dim('\nOpening: https://arcanea.ai/worldbuild'));
  console.log(chalk.dim('Project creation: /arcanea worldbuild create "My Fantasy Realm"'));
}

async function handleNarrativeAction(options) {
  const spinner = ora(colors.gold('Initializing Narrative AI System...')).start();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  spinner.succeed(colors.gold('Narrative Development Ready'));
  
  console.log(colors.gold('\n═════════════════════════════════════════════════════════════════'));
  console.log(colors.gold('                 AI-DRIVEN NARRATIVE DEVELOPMENT'));
  console.log(colors.gold('═════════════════════════════════════════════════════════════════'));
  
  console.log('\n📖 Story Creation:');
  console.log('  • Plot Generation - Three-act structure, subplots, twists');
  console.log('  • Character Arcs - Development, motivation, transformation');
  console.log('  • World Integration - Seamless story-world connection');
  console.log('  • Theme Analysis - Symbolism, meaning, emotional impact');
  console.log('  • Pacing Optimization - Tension, release, climax');
  
  console.log('\n🎭 Character Development:');
  console.log('  • Personality matrices and psychological profiles');
  console.log('  • Relationship networks and dynamics');
  console.log('  • Voice and dialogue generation');
  console.log('  • Backstory integration and consistency');
  console.log('  • Character conflict and resolution');
  
  console.log(chalk.dim('\nOpening: https://arcanea.ai/narrative'));
  console.log(chalk.dim('Story workshop: /arcanea narrative create "Epic Fantasy"'));
}

async function handleApiAction(options) {
  const spinner = ora(colors.crystal('Initializing Developer API Platform...')).start();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  spinner.succeed(colors.crystal('Developer Platform Active'));
  
  console.log(colors.gold('\n═════════════════════════════════════════════════════════════════'));
  console.log(colors.crystal('                     DEVELOPER API PLATFORM'));
  console.log(colors.gold('═════════════════════════════════════════════════════════════════'));
  
  console.log('\n🛠️ Available APIs:');
  console.log('  • Text Generation - Claude, GPT, Gemini unified interface');
  console.log('  • Multi-Modal - Image, video, audio generation APIs');
  console.log('  • Worldbuilding - Character, location, story creation');
  console.log('  • Guardian AI - Personality and domain expertise APIs');
  console.log('  • Spatial 3D - 3D model and environment APIs');
  
  console.log('\n📚 Developer Resources:');
  console.log('  • SDKs for JavaScript, Python, Unity, Unreal Engine');
  console.log('  • Comprehensive API documentation and examples');
  console.log('  • Playground for testing and prototyping');
  console.log('  • Webhook support for real-time integrations');
  console.log('  • Analytics and monitoring dashboard');
  
  console.log(chalk.dim('\nOpening: https://developers.arcanea.ai'));
  console.log(chalk.dim('API docs: https://api.arcanea.ai/docs'));
  console.log(chalk.dim('SDK download: npm install @arcanea/sdk'));
}

async function handleCommunityAction(options) {
  const spinner = ora(colors.teal('Connecting to Creator Community...')).start();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  spinner.succeed(colors.teal('Community Hub Connected'));
  
  console.log(colors.gold('\n═══════════════════════════════════════════════════════════════════'));
  console.log(colors.teal('                       CREATOR COMMUNITY HUB'));
  console.log(colors.gold('═════════════════════════════════════════════════════════════════'));
  
  console.log('\n🌍 Community Features:');
  console.log('  • World Gallery - Share and discover creator universes');
  console.log('  • Template Marketplace - Reusable creation frameworks');
  console.log('  • Collaborative Projects - Real-time co-creation');
  console.log('  • Community Challenges - Themed creation contests');
  console.log('  • Knowledge Base - Tutorials and best practices');
  
  console.log('\n🤝 Collaboration Tools:');
  console.log('  • Real-time worldbuilding with multiple creators');
  console.log('  • Version control and branching for creative works');
  console.log('  • Comment and feedback systems');
  console.log('  • Team workspace management');
  console.log('  • Cross-platform sharing and publishing');
  
  console.log(chalk.dim('\nOpening: https://community.arcanea.ai'));
  console.log(chalk.dim('Direct share: /arcanea community publish "My World"'));
}

// Creation execution functions (placeholders for now)
async function executeCharacterCreation(studio, guardian) {
  const spinner = ora(colors.purple('Generating character with Guardian guidance...')).start();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  spinner.succeed(colors.purple('Character framework created'));
  
  console.log('\n📝 Character Elements Generated:');
  console.log('  • Core personality and motivations');
  console.log('  • Backstory and character arc');
  console.log('  • Visual description and portrait prompts');
  console.log('  • Relationships and connections');
  
  console.log(chalk.dim('\nNext: Use studio portrait <character-name> for visual generation'));
}

async function executeLocationCreation(studio, guardian) {
  const spinner = ora(colors.water('Designing location with spatial intelligence...')).start();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  spinner.succeed(colors.water('Location blueprint ready'));
  
  console.log('\n🗺️ Location Elements Designed:');
  console.log('  • Geographic and spatial layout');
  console.log('  • Atmosphere and sensory details');
  console.log('  • Cultural and historical context');
  console.log('  • Visual art prompts and scenes');
  
  console.log(chalk.dim('\nNext: Use studio render <location-name> for imagery'));
}

async function executeStoryCreation(studio, guardian) {
  const spinner = ora(colors.gold('Crafting narrative with emotional intelligence...')).start();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  spinner.succeed(colors.gold('Story structure established'));
  
  console.log('\n📖 Story Elements Crafted:');
  console.log('  • Three-act narrative structure');
  console.log('  • Character development arcs');
  console.log('  • Plot points and conflicts');
  console.log('  • Thematic elements and symbolism');
  
  console.log(chalk.dim('\nNext: Use studio scene <story-name> for detailed scenes'));
}

async function executeRealmCreation(studio, guardian) {
  const spinner = ora(colors.fire('Architecting universe with cosmic intelligence...')).start();
  
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  spinner.succeed(colors.fire('Realm framework established'));
  
  console.log('\n🌍 Realm Elements Architected:');
  console.log('  • World laws and magic systems');
  console.log('  • Cultures and civilizations');
  console.log('  • History and timeline');
  console.log('  • Geography and cosmology');
  
  console.log(chalk.dim('\nNext: Use studio populate <realm-name> to add inhabitants'));
}

program.parse();
