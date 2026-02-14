# AIOS Daemon HTTP API

> Base URL: `http://127.0.0.1:3333`

## Status & Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (always returns `{success: true}`) |
| GET | `/status` | Daemon status: uptime, PID, connections, plugin counts |

## Tools

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tools` | List all available tools (built-in + plugin) |
| POST | `/tools/:name` | Call a tool by name. Body: JSON args |

## Resources

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/resources` | List MCP resources (guardians, awakened, gates) |
| GET | `/resources/:uri` | Read a specific resource by URI |

## Plugins

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plugins` | List all discovered plugins |
| POST | `/plugins/:name/activate` | Activate a plugin |
| POST | `/plugins/:name/deactivate` | Deactivate a plugin |
| DELETE | `/plugins/:name` | Uninstall a plugin |

## Journey

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/journey` | Get current journey state (gates, experience, achievements) |
| POST | `/journey` | Create a new journey (starts at Foundation gate) |
| PATCH | `/journey` | Update journey state. Body: partial JourneyState |
| POST | `/journey/gates/:gate/unlock` | Unlock a gate by name |

## Drafts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/drafts` | List all drafts |
| GET | `/drafts/:id` | Get a specific draft |
| POST | `/drafts` | Create a draft. Body: `{title, content, type, gate?, guardian?, tags, status}` |
| PATCH | `/drafts/:id` | Update a draft. Body: partial Draft |
| DELETE | `/drafts/:id` | Delete a draft |

## Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | Get user settings (theme, defaultGuardian, autoSync, etc.) |
| PATCH | `/settings` | Update settings. Body: partial UserSettings |

## Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sync/status` | Get sync state (pending count, conflicts) |
| POST | `/sync/push` | Push local changes to cloud (not yet configured) |
| POST | `/sync/pull` | Pull cloud changes to local (not yet configured) |

## AgentDB (Claude Code Hook Data)

Read-only bridge to the shared AgentDB at `~/.arcanea/agentdb.sqlite3`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agentdb/stats` | Aggregate counts: agents, memories, routing logs, vault entries, tasks |
| GET | `/agentdb/guardians` | All 10 Guardian agents with status, model, gate, element |
| GET | `/agentdb/routing` | Last 50 prompt routing decisions (guardian, confidence, keywords) |
| GET | `/agentdb/memories` | Last 50 memory entries from hook operations |
| GET | `/agentdb/vault` | Last 20 vault entries (session summaries, SIS bridge data) |

## Response Format

All endpoints return:

```json
{
  "success": true,
  "data": { ... }
}
```

On error:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Starting the Daemon

```bash
# Foreground (development)
node bin/aios.js daemon start --foreground

# Background
node bin/aios.js daemon start

# Stop
node bin/aios.js daemon stop

# Status
node bin/aios.js daemon status
```

## Configuration

Default config in `~/.arcanea/`:
- `state.json` — Journey, drafts, settings, plugin state, sync state
- `agentdb.sqlite3` — Agent database (shared with Claude Code hooks)
- `plugins/` — Plugin directory
- `daemon.pid` — PID file for background daemon
