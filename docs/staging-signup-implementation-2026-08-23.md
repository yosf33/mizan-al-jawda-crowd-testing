# Staging Signup Implementation

**Scope:** Arabic email-and-password signup for the isolated staging branch and staging Supabase project only. No Production configuration, user, deployment, domain, or Manus deployment is included in this change.

## Configuration baseline

The staging Supabase project `qtjrdaszpchanimnzgtd` was inspected through the connected dashboard on 23 August 2026. Email authentication is enabled, **Confirm email** is enabled, and anonymous sign-ins and manual linking are disabled. **Allow new users to sign up** remains disabled at this point, so the staged UI is intentionally not yet activated against the Auth provider.

## Implemented flow

The application now exposes `/sign-up` and links to it from the homepage and sign-in page. The form accepts an email address, enforces a 12-character minimum password, requires password confirmation, uses accessible Arabic validation messages, and calls Supabase `auth.signUp` only after client-side validation. Its confirmation redirect is `window.location.origin`, which corresponds to the exact stable staging Preview URL already allowed by the staging Auth URL configuration.

After submission, the page gives a neutral confirmation message rather than disclosing whether a particular email address already has an account. The user must confirm the email before signing in and completing role onboarding. The form never sends passwords to project logs or documentation.

## Validation

The full test suite completed with **29 passing tests and 1 intentional opt-in database integration skip**. The production build completed successfully. Mobile screenshots at 375 px show that the signup and sign-in forms remain visible and do not overflow the viewport. Vite continues to report the pre-existing advisory that the main client bundle exceeds 500 kB.

## Activation gate

Before an end-to-end staging signup can be exercised, enable **Allow new users to sign up** in the staging Supabase Auth provider settings, leaving Email and Confirm email enabled and anonymous/manual linking disabled. This dashboard setting is intentionally awaiting explicit user approval. After activation, validate a purpose-made staging-only email confirmation and sign-in without using or retaining credentials in project artifacts. No Production enablement is authorized by this document.
