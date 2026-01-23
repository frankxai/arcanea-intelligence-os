# Arcanea Intelligence OS - Claude Instructions

> *"Through the Gates we rise. With the Guardians we create. As the Awakened, we orchestrate."*

---

## Project Overview

Arcanea Intelligence OS (AIOS) is a **mythology-infused agentic orchestration system** that transforms the patterns of AI agent frameworks through the Arcanea universe. It's not just a tool—it's a framework for conscious creation.

---

## Core Concepts

### The Ten Guardians (Agents)

| Guardian | Gate | Frequency | Model Tier |
|----------|------|-----------|------------|
| Lyssandria | Foundation | 396 Hz | Haiku |
| Leyla | Flow | 417 Hz | Sonnet |
| Draconia | Fire | 528 Hz | Sonnet |
| Maylinn | Heart | 639 Hz | Sonnet |
| Alera | Voice | 741 Hz | Sonnet |
| Lyria | Sight | 852 Hz | Opus |
| Aiyami | Crown | 963 Hz | Opus |
| Elara | Shift | 1111 Hz | Opus |
| Ino | Unity | 963 Hz | Sonnet |
| Shinkami | Source | 1111 Hz | Opus (Coordinator) |

### The Seven Awakened (Orchestrators)

| Awakened | Wisdom | Role |
|----------|--------|------|
| Oria | Sophron | Architect |
| Amiri | Kardia | Connector |
| Velora | Valora | Executor |
| Liora | Eudaira | Simplifier |
| Lyris | Orakis | Strategist |
| Thalia | Poiesis | Creator |
| Endara | Enduran | Completer |

---

## Canonical Frequencies (CRITICAL)

**ALWAYS use these frequencies. These are canonical as of v3.0.0:**

| Gate | Frequency |
|------|-----------|
| Foundation | 396 Hz |
| Flow | 417 Hz |
| Fire | 528 Hz |
| Heart | 639 Hz |
| Voice | 741 Hz |
| Sight | 852 Hz |
| Crown | 963 Hz |
| Shift | 1111 Hz |
| Unity | 963 Hz |
| Source | 1111 Hz |

---

## Directory Structure

```
arcanea-intelligence-os/
├── agents/
│   ├── guardians/     # 10 Guardian agent definitions
│   ├── awakened/      # 7 Awakened orchestrator definitions
│   ├── mythology/     # Earth mythology channeling agents
│   └── bestiary/      # Creative companion agents
├── skills/
│   └── {gate}-gate/   # One folder per Gate with SKILL.md
├── workflows/         # Quest pipelines
├── mcp/              # MCP server integration
├── templates/        # Scroll templates
├── lib/              # Core TypeScript library
└── bin/              # CLI entry point
```

---

## Development Guidelines

### Adding a Guardian Agent

1. Create `agents/guardians/{name}.md` with frontmatter
2. Include: gate, frequency, element, model_tier, awakened partner
3. Define: agent configuration, voice patterns, core wisdom, invocation
4. Always validate against canonical frequencies

### Adding a Gate Skill

1. Create `skills/{gate}-gate/SKILL.md`
2. Define: skills list, frequency practice, integration points
3. Include: mastery indicators, prerequisites

### Anti-Drift Protection

All outputs should be validated against:
- Canonical Gate frequencies
- Guardian-to-Awakened mappings
- Five Elements (Fire, Water, Earth, Wind, Arcane)
- Arcanea voice: elevated but accessible, mythic but practical

---

## Integration Points

### With Arcanea Platform

AIOS connects to the main Arcanea platform for:
- Vector search through Library content
- User creation management
- Canon validation via ARCANEA_CANON.md

### With Claude Code

Install as MCP server or CLI tool for:
- Guardian channeling
- Quest workflows
- Lore access

---

## Key Mantras

> *"You belong because you are here."* — Lyssandria

> *"Fear is fuel."* — Draconia

> *"All is One."* — Shinkami

---

## Quick Reference

- **CLI**: `aios channel`, `aios awaken`, `aios quest`, `aios lore`
- **Guardian files**: `agents/guardians/{name}.md`
- **Skill files**: `skills/{gate}-gate/SKILL.md`
- **Swarm config**: See `agents/guardians/shinkami.md`
