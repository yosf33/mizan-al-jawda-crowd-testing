# Arabic Typography Reference Notes — 24 August 2026

The supplied headline reference is 583 × 191 pixels. A red arrow highlights an overly tight cluster of Arabic dots/diacritic marks at the boundary of the two-line display heading.

The supplied dark-banner reference is 629 × 153 pixels. Its red arrow highlights the same class of collision: a dot/diacritic cluster sits too close to a nearby large glyph in the second line.

The required implementation response is typographic rather than content-based: apply a reliable Arabic display font, avoid over-aggressive line-height or letter-spacing, and provide sufficient line separation for multi-line headings. The visible issue is not a missing character or a content error.

## Staging implementation and validation

The staging client now uses **Noto Kufi Arabic** for prominent Arabic display surfaces, with normal letter spacing, enabled ligatures, and increased line-height. This replaces the tight display metrics that allowed dots and diacritics in large multi-line headings to appear visually crowded. The public hero and sensitive-evidence banner both use this treatment; workspace headings inherit the same Arabic-safe display family.

Sidebar selection is now compared against a normalized query string, so routes such as `?section=reports`, `?section=wallet`, and the role-specific workflow sections visibly retain their active navigation state. The public home page also distinguishes an authenticated visit by showing a signed-in state, the current account email to that account holder, and a direct workspace action. No credential values are rendered or stored by this enhancement.

Validation completed on staging source: the focused UI regression suite and the complete suite passed (**55 tests passed; 1 existing opt-in database test skipped**), and the production build completed. Desktop and 375-pixel mobile screenshots were reviewed; the mobile headline scale was adjusted to avoid leaving a single large Arabic word on its own line.

### Follow-up home-page refinement

For an authenticated visitor, the public hero now removes the generic **انضم كمختبر** and **أطلق دورة اختبار** onboarding actions. The signed-in identity card and dedicated **فتح المساحة** action remain, giving the user one clear next step without repeating entry actions intended for visitors. For signed-out visitors, the benefits row now uses **تقارير بحالة واضحة** in place of the removed generic RTL claim. The focused regression suite and complete staging suite passed after this refinement (**56 tests passed; 1 existing opt-in database test skipped**); the production build also completed successfully.
