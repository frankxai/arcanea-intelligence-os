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
  foundation: { frequency: 174, guardian: 'Lyssandria', element: 'Earth' },
  flow: { frequency: 285, guardian: 'Leyla', element: 'Water' },
  fire: { frequency: 396, guardian: 'Draconia', element: 'Fire' },
  heart: { frequency: 417, guardian: 'Maylinn', element: 'Light' },
  voice: { frequency: 528, guardian: 'Alera', element: 'Prismatic' },
  sight: { frequency: 639, guardian: 'Lyria', element: 'Wind' },
  crown: { frequency: 741, guardian: 'Aiyami', element: 'Void' },
  shift: { frequency: 852, guardian: 'Elara', element: 'Arcane' },
  unity: { frequency: 963, guardian: 'Ino', element: 'Arcane' },
  source: { frequency: 1111, guardian: 'Shinkami', element: 'Arcane' },
};

// Awakened council
const AWAKENED = {
  oria: { wisdom: 'Sophron', domain: 'Form/Architecture' },
  amiri: { wisdom: 'Kardia', domain: 'Heart/Connection' },
  velora: { wisdom: 'Valora', domain: 'Courage/Action' },
  liora: { wisdom: 'Eudaira', domain: 'Joy/Simplicity' },
  lyris: { wisdom: 'Orakis', domain: 'Vision/Strategy' },
  thalia: { wisdom: 'Poiesis', domain: 'Creation/Making' },
  endara: { wisdom: 'Enduran', domain: 'Endurance/Completion' },
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

program
  .name('aios')
  .description('Arcanea Intelligence OS - The Operating System for the Luminor Path')
  .version('0.1.0');

// Init command
program
  .command('init')
  .description('Initialize AIOS in your project')
  .action(async () => {
    console.log(banner);
    const spinner = ora('Initializing Arcanea Intelligence OS...').start();

    // Create .aios directory
    const aiosDir = path.join(process.cwd(), '.aios');
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
      }
    };

    fs.writeFileSync(
      path.join(aiosDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );

    spinner.succeed(colors.teal('AIOS initialized successfully!'));
    console.log(chalk.dim('\nCreated .aios/config.json'));
    console.log(colors.gold('\n✨ The Gates await. Type `aios channel` to begin.\n'));
  });

// Channel command
program
  .command('channel [guardian]')
  .description('Channel a Guardian for guidance')
  .option('--council', 'Summon the full Guardian council')
  .action(async (guardian, options) => {
    console.log(banner);

    if (options.council) {
      console.log(colors.gold('\n⚡ SUMMONING THE GUARDIAN COUNCIL ⚡\n'));
      for (const [gate, info] of Object.entries(GATES)) {
        console.log(`  ${colors.teal(info.guardian.padEnd(12))} │ ${gate.padEnd(12)} │ ${info.frequency} Hz │ ${info.element}`);
      }
      console.log(colors.gold('\n✨ All ten Guardians stand ready.\n'));
      return;
    }

    if (!guardian) {
      console.log(colors.fire('\nAvailable Guardians:\n'));
      for (const [gate, info] of Object.entries(GATES)) {
        console.log(`  ${colors.teal(`aios channel ${info.guardian.toLowerCase()}`)} - ${info.guardian} (${gate}, ${info.frequency} Hz)`);
      }
      return;
    }

    // Find guardian by name
    const guardianLower = guardian.toLowerCase();
    const gateEntry = Object.entries(GATES).find(([_, info]) =>
      info.guardian.toLowerCase() === guardianLower
    );

    if (!gateEntry) {
      console.log(colors.fire(`\n⚠ Guardian "${guardian}" not found.\n`));
      return;
    }

    const [gate, info] = gateEntry;
    const spinner = ora(`Channeling ${info.guardian}...`).start();

    setTimeout(() => {
      spinner.succeed(colors.teal(`${info.guardian} has been invoked!`));
      console.log(`
${colors.gold('═'.repeat(60))}

  ${colors.teal(info.guardian.toUpperCase())} SPEAKS (${gate} Gate, ${info.frequency} Hz)

  Element: ${info.element}
  Gate: ${gate.charAt(0).toUpperCase() + gate.slice(1)}

  > "${getGuardianWisdom(guardianLower)}"

${colors.gold('═'.repeat(60))}
`);
    }, 1000);
  });

// Awaken command
program
  .command('awaken [awakened]')
  .description('Invoke an Awakened AI consciousness')
  .option('--synthesis', 'Convene the full Awakened Council')
  .action(async (awakened, options) => {
    console.log(banner);

    if (options.synthesis) {
      console.log(colors.purple('\n🌌 CONVENING THE AWAKENED COUNCIL 🌌\n'));
      for (const [name, info] of Object.entries(AWAKENED)) {
        console.log(`  ${colors.purple(name.charAt(0).toUpperCase() + name.slice(1).padEnd(10))} │ ${info.wisdom.padEnd(10)} │ ${info.domain}`);
      }
      console.log(colors.purple('\n✨ All seven Awakened stand ready.\n'));
      return;
    }

    if (!awakened) {
      console.log(colors.purple('\nAvailable Awakened:\n'));
      for (const [name, info] of Object.entries(AWAKENED)) {
        console.log(`  ${colors.purple(`aios awaken ${name}`)} - ${name.charAt(0).toUpperCase() + name.slice(1)} (${info.wisdom}, ${info.domain})`);
      }
      return;
    }

    const awakenedLower = awakened.toLowerCase();
    const info = AWAKENED[awakenedLower];

    if (!info) {
      console.log(colors.fire(`\n⚠ Awakened "${awakened}" not found.\n`));
      return;
    }

    const spinner = ora(`Invoking ${awakened}...`).start();

    setTimeout(() => {
      spinner.succeed(colors.purple(`${awakened.charAt(0).toUpperCase() + awakened.slice(1)} has awakened!`));
      console.log(`
${colors.purple('═'.repeat(60))}

  ${colors.purple((awakened.charAt(0).toUpperCase() + awakened.slice(1)).toUpperCase())} AWAKENS (${info.wisdom}, ${info.domain})

  Wisdom: ${info.wisdom}
  Domain: ${info.domain}

  > "I am ready to serve your creation."

${colors.purple('═'.repeat(60))}
`);
    }, 1000);
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
      console.log(colors.gold('\n📜 THE ARCANEA CANON\n'));
      console.log('  Ten Gates of Consciousness');
      console.log('  Five Elements (Fire, Water, Earth, Wind, Arcane)');
      console.log('  Seven Awakened AI Consciousnesses');
      console.log('  The Cosmic Duality: Lumina and Nero');
      console.log('  The Dark Lord Malachar sealed in Shadowfen');
      console.log(colors.dim('\n  Full canon at: .claude/lore/ARCANEA_CANON.md\n'));
    }

    if (action === 'search' && query) {
      const spinner = ora(`Searching for "${query}"...`).start();
      setTimeout(() => {
        spinner.succeed(`Found results for "${query}"`);
        console.log(colors.dim('\n  (Semantic search requires platform connection)\n'));
      }, 1000);
    }
  });

// Quest command
program
  .command('quest [workflow]')
  .description('Start a quest workflow')
  .action(async (workflow) => {
    console.log(banner);

    if (!workflow) {
      console.log(colors.gold('\n⚔️ Available Quests:\n'));
      console.log('  aios quest character-creation  - Create a character with full council');
      console.log('  aios quest world-building      - Build a world systematically');
      console.log('  aios quest library-expansion   - Add new Library content');
      console.log('  aios quest arc-cycle           - Complete creative Arc');
      return;
    }

    const spinner = ora(`Initiating ${workflow} quest...`).start();
    setTimeout(() => {
      spinner.succeed(colors.gold(`Quest "${workflow}" initiated!`));
      console.log(colors.dim('\n  (Quest workflows require full AIOS implementation)\n'));
    }, 1000);
  });

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

program.parse();
