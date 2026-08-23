# GitHub and Vercel Branch Mapping

The apparent difference between the GitHub branch pages and the running site is expected. Vercel Production is configured to deploy the Git branch `migration/supabase-vercel-free-tier`, not `main` and not `staging`.

## Verified mapping

| Environment | Git branch | Current commit | Deployment role |
|---|---|---:|---|
| Production | `migration/supabase-vercel-free-tier` | `5f96446` | Public Production deployment |
| Staging | `staging` | `24b2ec3` | Preview deployment |
| Main | `main` | `318992c` | Historical Preview only; not the Production source |

The recent Production releases were deliberately **selective**, not a merge of all staging commits. Commit `17184d8` carried the reviewed signup interface, and commit `5f96446` carried only the public workspace and policy-route repair. These commits are on the Production branch and appear as Vercel Production deployments. The broader staging-only workflow changes and documentation stay on `staging` until separately approved.

No branch or deployment was changed during this investigation.
