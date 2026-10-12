# Prior-Art And Source Evidence

## Evidence reviewed

- The local `lvsea-zao-skill` package was read as the method source for intent capture, one-root discoverability, trigger regression, context budgeting, evidence boundaries, secret scanning, and governed publication.
- The local `codex-jev-gate` package was read as the behavior source for explicit-only activation, bounded candidate preparation, `jev_rerank`, top-two probability difference, confirmation wording, and fallback labeling.
- The package README credits the reviewed `qiaomu-meta-skill` and `yao-meta-skill` repositories as upstream inspiration for the adopted engineering method; this package does not mirror either repository wholesale.

## Keep / adapt / reject

| Decision | Mechanism | Reason |
| --- | --- | --- |
| Keep | root `SKILL.md`, interface metadata, trigger fixtures, reports, local gates | Makes the Skill discoverable and reviewable |
| Keep | feature branch, PR, Release, discovery and clean-install checks | Prevents an unreviewed default-branch publication |
| Adapt | source-boundary and trust language | Candidate payload needs only bounded Skill metadata |
| Adapt | provider/fallback evidence | JEV probability must never be confused with lexical fallback |
| Reject | automatic scanning of every new task | User explicitly changed the operating mode to manual invocation |
| Reject | business artifact creation inside the gate | The gate only routes and requests confirmation |

## Missing evidence

Static package checks do not prove that a JEV account, key, quota, or provider is available. A real provider-backed probability response is therefore recorded as missing evidence until a live call succeeds.
