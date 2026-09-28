# skills

Agent skills for [OpenCode](https://opencode.ai). One folder per skill, each a `SKILL.md` with YAML frontmatter plus whatever supporting files it needs.

## Install

Copy a skill folder into any of the paths OpenCode loads from:

```bash
# global, all projects
cp -r skills/web-search ~/.config/opencode/skills/
# or the cross-compatible path
cp -r skills/web-search ~/.agents/skills/

# project-local
cp -r skills/web-search .opencode/skills/
```

## Skills

| Skill | What it does |
| --- | --- |
| [`web-search`](skills/web-search) | Search DuckDuckGo from a real browser and read the results as markdown, via the `chrome-devtools` MCP. |

## Requirements

`web-search` needs the `chrome-devtools` MCP server and a running Chrome. In `opencode.json`:

```json
{
  "mcp": {
    "chrome-devtools": {
      "type": "local",
      "command": ["npx", "-y", "chrome-devtools-mcp@latest"],
      "enabled": true
    }
  }
}
```
