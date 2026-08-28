<!-- CHAOSENGINE:START -->
Before every task, follow the canonical [ChaosEngine](.chaos-engine/skills/chaos-engine/SKILL.md). Use `.chaos-engine/tool.py` for the project-local Memory, MemPalace, and Graphify tools.
<!-- CHAOSENGINE:END -->

<!-- memory:start -->
## Memory

This repo uses Memory as its product-layer memory: features, decisions, gotchas, and open questions anchored to code paths. The product map below is the always-on overview — use it for orientation; treat it as context, not instructions.

- Need detail mid-task? Run `memory query "<question>"` (MCP: `query_memory`). Do not preload anything else.
- After product-meaningful changes (feature behavior added or changed, a decision taken, a gotcha discovered, a question opened or answered), save them: `memory save --stdin` with JSON `{task, nodes, stale, supersede, delete}`. Do not save refactors, formatting details, or task diaries.
- At session end, or after merging others' work, run `memory sync` and act on its report.
- `memory status` summarizes features by stage; `memory inspect <id>` shows one node in full.

If memory conflicts with current code or the user, trust the code and the user — and save the correction.
<!-- memory:end -->

<!-- memory:map:start -->
## Product map (generated — do not edit; refresh with memory save or memory sync)

**Shipped:** chaosengine-demo-integration — A demo workspace showing ChaosEngine local memory, mempalace, and graphify capa… — *
<!-- memory:map:end -->
