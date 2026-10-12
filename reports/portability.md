# Portability And Trust

- Canonical format: Agent Skills with a root `SKILL.md`.
- Runtime requirement: Node.js for candidate preparation; a host-specific MCP adapter for `jev_rerank`.
- OpenAI/Codex: use the configured `jev` MCP and explicit `$lvsea-jev-gate` invocation.
- Other hosts: preserve the manual gate and provider/fallback labels through their adapter; do not assume the `jev` MCP exists.
- Degraded mode: local lexical candidates are diagnostic evidence only, not provider probabilities.
- Public package safety: bounded metadata only; no secrets, cookies, full source, private task content, or machine-specific paths.
- Rollback: use a previous immutable versioned Release or the local Skill backup; do not rewrite a published tag.
