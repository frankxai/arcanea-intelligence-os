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

const program = new Command();

// Get package root (where bin/ lives)
const packageRoot = path.resolve(__dirname, '..');

// ANSI color constants for Arcanea theme
const colors = {
  teal: chalk.hex('#7fffd4'),
  gold: chalk.hex('#ffd700'),
  purple: chalk.hex('#9966ff'),
  fire: chalk.hex('#ff6b35'),
  water: chalk.hex('#78a6ff'),
  earth: chalk.hex('#8b7355'),
};

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

// ASCII Banner
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
  .version('0.1.0');

// Init command
program
  .command('init')
  .description('Initialize AIOS in your project')
  .option('--force', 'Overwrite existing configuration')
  .action(async (options) => {
    console.log(banner);

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
  .description('Channel a Guardian for guidance')
  .option('--council', 'Summon the full Guardian council')
  .option('--prompt', 'Output the Guardian prompt for AI use')
  .option('--raw', 'Output the raw agent definition file')
  .action(async (guardian, options) => {
    if (!options.prompt && !options.raw) {
      console.log(banner);
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
  .description('Invoke an Awakened AI consciousness')
  .option('--synthesis', 'Convene the full Awakened Council')
  .option('--raw', 'Output the raw agent definition file')
  .action(async (awakened, options) => {
    console.log(banner);

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
    console.log(banner);

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
    console.log(banner);

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
    console.log(banner);

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
      console.log(banner);
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
      console.log(banner);
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
    console.log(banner);

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
      const { createGeminiService, GATE_VISUAL_STYLES } = require('../dist/infogenius/index.js');

      const gate = options.gate || 'source';
      const gateStyle = GATE_VISUAL_STYLES[gate];
      if (!gateStyle) {
        console.log(colors.fire(`\nInvalid gate: ${gate}\n`));
        console.log(chalk.dim('Valid gates: ' + Object.keys(GATE_VISUAL_STYLES).join(', ')));
        return;
      }

      const spinner = ora(`Generating ${type} visualization...`).start();

      const service = createGeminiService();

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

      spinner.succeed(colors.teal(`${type.charAt(0).toUpperCase() + type.slice(1)} visualization generated!`));

      console.log(`
${colors.gold('═'.repeat(60))}

  ${colors.purple(type.toUpperCase())} VISUALIZATION

  Subject: ${name || 'Guardian Portrait'}
  Gate: ${gate} (${gateStyle.guardian}, ${gateStyle.frequency})
  Style: ${gateStyle.artisticStyle}

${colors.gold('─'.repeat(60))}

  ${colors.teal('GENERATED PROMPT:')}

${chalk.dim(result.prompt.split('\n').map(l => '  ' + l).join('\n'))}

${colors.gold('═'.repeat(60))}

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
    console.log(banner);

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

program.parse();
