# Operating Boundary

`lvsea-jev-gate` is a manual routing gate, not a universal middleware layer. Its default state is inactive. An ordinary task must follow the host agent's normal Skill trigger rules unless the user explicitly invokes `$lvsea-jev-gate` or `@lvsea-jev-gate`.

The gate has one bounded cycle: prepare the catalog, call the configured reranker, report candidates and evidence, ask for confirmation, then stop. A changed objective starts a new cycle. Silence is not authorization.

The package separates four facts:

1. A `jev` MCP configuration is present.
2. The provider starts and accepts a call.
3. The provider returns candidates with verifiable probabilities.
4. The user confirms execution.

No one fact substitutes for another.
