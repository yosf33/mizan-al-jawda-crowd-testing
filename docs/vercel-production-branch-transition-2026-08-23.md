# Vercel Production Branch Transition

The user approved changing the Vercel Production Branch from `migration/supabase-vercel-free-tier` to `main` after `main` was synchronized with the current Production code.

The initial Vercel Git settings inspection confirms that the project remains connected to `yosf33/mizan-al-jawda-crowd-testing`. The visible Git settings controls contain repository and commit-status options; the Production Branch selector is managed through the Production environment’s branch-tracking settings.

On 2026-08-23, the Production environment’s branch-tracking value was changed from `migration/supabase-vercel-free-tier` to `main` and saved in Vercel. The setting now states that every commit pushed to `main` will create a Production Deployment. The retained migration branch was not deleted or otherwise changed.

Immediately after saving the setting, Vercel showed the synchronized `main` commit `6a9d1dc` as a Ready Preview deployment. It did not automatically create a new Production deployment; the most recent Production deployment remained the Ready `5f96446` deployment from the former branch. That deployment contains the code synchronized into `main`, so the public site was not intentionally changed by this configuration-only action. A subsequent push to `main`, or an explicitly approved promotion/redeployment of the existing main deployment, will create the next Production deployment from `main`.

Read-only public checks completed after the setting change: the Production homepage loaded with the Arabic RTL landing content, and `/sign-up` loaded with the email, password, and confirmation inputs. No account was created and no authentication or financial workflow was submitted.

The existing authenticated browser session was then used only to read `/workspace`. After the initial loading state, the Production tester workspace rendered its dashboard and zero-balance/empty-state information. No report, payout request, or other state-changing action was taken.

Finally, `/policies#privacy` loaded its public Arabic privacy, terms-of-use, and evidence-policy content. This completed the planned read-only route checks without modifying production data.
