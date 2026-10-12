# Provider And Fallback

The preparation script creates two different outputs:

- `mcp_rerank`: a bounded request intended for the configured `jev_rerank` provider.
- `localFallback`: a deterministic lexical ordering used only when the provider is unavailable or when preparing a request.

The fallback is useful for diagnostics, but its scores are not Jev probabilities. Reports must state the provider status explicitly and must never turn a fallback number into a provider claim.

The candidate card contains only Skill name, scope, path, a bounded description, and local evidence. It excludes full source files, credentials, cookies, unrelated project data, and user-private content.
