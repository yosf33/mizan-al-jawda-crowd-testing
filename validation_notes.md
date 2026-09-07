# Validation Notes

The public landing page was opened in a browser and rendered in Arabic RTL with the sacred-geometry composition, the required feature phrases **Pay per Valid Bug** and **100+ devices**, dual tester/client calls to action, process steps, and evidence-access statement.

The public onboarding route was also opened while signed out. It rendered a focused Arabic sign-in gate, confirming that account setup is protected before role selection and financial configuration are shown.

The production bundle completed successfully. The automated test suite passed three tests covering logout behavior, role authorization helper behavior, and two-decimal financial formatting. TypeScript compilation completed with no errors.

## Tester Dashboard Performance Optimization & Staging Validation (September 2026)

1. **Backend Query Split & Parallelization (Phase 1):** In `server/crowdtesting.ts` and `server/routers.ts`, the sequential `dashboardFor()` tester query chain was refactored into focused, parallelized procedures (`tester.overview`, `tester.reportsData`, `tester.walletData`, `tester.devicesData`). Heavy 30-report joins and wallet transaction limits are isolated to dedicated sections, while `overview` queries only active cycles, invitations, and lightweight `count(*)` counts. In `client/src/pages/Workspace.tsx`, the top-level monolithic dashboard fetch was disabled for role `tester`, querying per-section data lazily only when navigated.
2. **Local JWT Auth Verification & Read-Before-Write Optimization (Phase 2):** Added `SUPABASE_JWT_SECRET` in `server/env.ts`. In `server/context.ts`, cryptographic JWT verification with `jose` (`jwtVerify`) executes locally, bypassing the remote Supabase Auth HTTP network roundtrip (~300-800ms saved per authenticated request). A read-before-write check on `profiles` eliminates row write-locks when profile data is unchanged.
3. **Waterfall Removal (Phase 3):** In `client/src/pages/Workspace.tsx`, `notifications.list` was ungated from `account.profile`, allowing tRPC batching into a single HTTP tick.
4. **Cache & Focus Refetch Tuning (Phase 4):** In `client/src/main.tsx`, configured `QueryClient` defaults with `staleTime: 30_000` and `refetchOnWindowFocus: false` to eliminate redundant query refetches on tab focus.
5. **Route-Level Code Splitting (Phase 5):** In `client/src/App.tsx`, implemented dynamic imports (`React.lazy` and `Suspense`) for `Workspace`, `SignIn`, `SignUp`, `Onboarding`, `Policies`, and `NotFound`. The initial landing bundle is reduced, isolating the workspace view into an independent ~220 KB chunk.
6. **Automated Verification:**
   - Full TypeScript compilation (`tsc --noEmit`): 0 errors.
   - Vite client production build: succeeded (generating isolated route chunks).
   - Esbuild server & Vercel Function handler builds: succeeded.
   - Vitest automated test suite: 18 test files passed (75 tests passed, 0 failures, 1 skipped).

