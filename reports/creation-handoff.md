# Creation Handoff

## Source boundary

The package was formed from the current local `lvsea-zao-skill` engineering method and the current explicit-only JEV gate behavior. No private conversation, credential, cookie, full local Skill catalog, or machine-specific absolute path is part of the public package.

## Delivered behavior

1. The Skill is inactive for ordinary tasks.
2. `$lvsea-jev-gate` and `@lvsea-jev-gate` explicitly activate one preflight cycle.
3. The preparation script emits bounded `mcp_rerank` input and a separately labeled `localFallback`.
4. The agent must show real probability values and the top-two `Δ`, or clearly state that only fallback evidence exists.
5. The agent must ask for “继续” before loading a candidate Skill or executing the actual task.

## Release boundary

The target is the public repository `lhylvsea/lvsea-jev-gate`, published through a feature branch, pull request, versioned Release, discovery check, and clean-install check. Local installation is synchronized separately to the Codex Skill root after the public package is validated.
