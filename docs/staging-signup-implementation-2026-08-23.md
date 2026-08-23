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

## Dual-environment activation request

The user subsequently requested self-service signup in both environments. The Production Supabase provider page was inspected before any change: Email is enabled, Confirm email is enabled, and Allow new users to sign up, manual linking, and anonymous sign-ins are all disabled. Staging has the same restrictive baseline. The pending staging deployment for source commit `e012cfb` is a Preview build; no Production deployment has been created from the signup feature at this point.

## Completed activation

The staging Preview for source commit `e012cfb` became Ready and the deployed `/sign-up` route rendered the Arabic signup form. With the user’s explicit approval, **Allow new users to sign up** was enabled and saved in both the isolated staging project and the Production project. In both environments, Email remains enabled, Confirm email remains enabled, and manual linking and anonymous sign-ins remain disabled. No accounts were created, no credentials were entered, and no Auth secrets, keys, or redirect URLs are recorded here.

The signup UI currently exists on the `staging` branch only. The Production Auth provider is ready to accept self-service signup once the UI is released through a separately reviewed and approved Production code promotion.

## Production release follow-up

The reviewed signup-only release was pushed to the Production branch after user approval. An immediate check of the public Production `/sign-up` URL still returned the prior deployment's 404 page, so it must not be treated as a completed release until the Vercel deployment finishes and the route is rechecked. No credential values were inspected or recorded.

The Vercel dashboard subsequently listed Production commit `17184d8` as a new **Building** deployment, while the corresponding staging source commit remained Ready. The prior Production deployment is still serving during this build; a final route check is pending Vercel completion.

Vercel subsequently marked Production commit `17184d8` **Ready** after 55 seconds and assigned it to `mizan-al-jawda-crowd-testing.vercel.app`. The pending final validation is to confirm the public `/sign-up` route resolves to the new Arabic interface rather than the prior 404 page.

The final public Production check confirmed that `https://mizan-al-jawda-crowd-testing.vercel.app/sign-up` now renders the Arabic signup interface with email, password, and password-confirmation fields, a 12-character password notice, an account-creation action, and a return-to-sign-in action. No account was created during this route validation.
