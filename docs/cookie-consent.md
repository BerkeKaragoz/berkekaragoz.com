# Cookie consent for GA4 and AdSense

Research for adding Google Analytics 4 and AdSense display ads with a consent banner that looks like the rest of the site, with placement and timing that can vary by page. The owner is UK-based. Researched 2026-11-06. This is not legal advice; the questions for counsel are listed at the end.

## Decision

Use **Google's own consent message** (AdSense → Privacy & messaging), restyled with our own CSS, for EEA, UK and Swiss visitors. Use **our own React banner** for everyone else. Both look like the site.

| Visitors | Banner | Placement | Timing |
|---|---|---|---|
| EEA, UK, Switzerland | Google's TCF message, restyled: full AdSense revenue | A dialog over a backdrop that covers the page. The look can vary per page. | Delayed through `controlledMessagingFunction` |
| Everyone else | Our own banner: Analytics and Advertising | **Free**: inline in an article, corner card, docked by a demo | Any delay we like |

Why:

- **It's free, and it's Google-certified.** Full ad revenue in the EEA, UK and Switzerland needs a certified IAB TCF consent tool. Without one, AdSense serves only cheaper "limited ads" there, and the UK is probably the site's largest audience. Google's message already supports TCF v2.4.
- **We can restyle it.** It renders in the page DOM, not an iframe or shadow DOM. A test on a live site showed:
  - a root `div.fc-consent-root`, with `.fc-dialog`, `.fc-dialog-overlay`, `.fc-primary-button` and `.fc-cta-consent`;
  - its styles come from one `<style>` tag in `<head>`, and our overrides took effect.
- **It covers GA4.** Since March 2025, AdSense's "Consent mode" setting passes the visitor's choice to GA4 as well, including `analytics_storage`.
- **We can delay it.** `controlledMessagingFunction` holds the message until we call `proceed()`.

The risks, accepted:

- **Fragile class names.** They're undocumented and can change at any time; an update could break our styling. Write the overrides defensively and look at the banner after Google updates.
- **Google may stop showing a non-compliant message.** It "may stop showing your messages" if they break IAB rules. Our CSS must not break the TCF rules below.
- **No dark mode or placement options built in.** We add both ourselves with CSS.

Runner-up, if hacking the CSS gets too painful: Cookiebot's custom template, about €7/month, where we write the banner's HTML, CSS and JS ourselves. First confirm with Cookiebot that a fully custom template stays covered by their CMP ID.

### What our CSS must not break (TCF Policies v5.0.b, Appendix B)

- **Covering the page (C(a)):** the message must be "a modal or banner that covers all or substantially all of the content". IAB has never defined that phrase, so this is our reading:
  - **Restyled dialog over a backdrop that dims or blurs the whole page:** probably fine.
  - **Dialog docked beside a page element, over that backdrop:** risky.
  - **Full-screen interstitial:** probably fine.
  - **Inline card in the page:** not allowed.
- **Content (C(b)):** don't hide or shrink any of these until they're unreadable:
  - the vendor count and its link;
  - the purposes and special features;
  - how to reopen the banner;
  - the consent and "Manage options" buttons.
- **Buttons (C(g)):** the two main buttons need the same font, size and style, and at least 5:1 contrast. Neither may look disabled.
- **Wording:** IAB's standard text stays as Google renders it.

### Ruled out

- **Our own banner with no certified tool:** UK, EEA and Swiss visitors would get limited ads only.
- **Our own TCF consent tool (a "private CMP"):** the rules allow it, but it isn't realistic for an individual.
  - IAB Europe charges €1,575 a year and validates the UI and technical setup.
  - Google has to certify it, and we'd recertify every year.
  - We'd have to keep up with every policy update.
  - All 52 private CMPs on Google's list belong to companies.
- **GA4 without prior consent for UK visitors** under the new PECR statistics exemption (Sch A1 para 5, in force 5 Feb 2026). This is contested:
  - The ICO requires the provider to be a processor that does no individual tracking, and GA4's `_ga` cookie is a per-visitor ID.
  - Ads need opt-in anyway, so one opt-in for everything costs little.

## Design rules for both banners

- **Nothing before consent.** GA4 and AdSense ad requests run only after a decision. Doing nothing, or simply browsing, is not consent (ICO, CNIL).
- **Equal-weight buttons.** Accept and Reject get the same weight.
  - Our banner orders them Settings, Necessary cookies only, Accept all. Accept and Necessary-only share the `card-input` style, so refusing is as prominent as accepting. Settings only opens the preferences, so it is the ghost `card-input-ghost` variant (text only, background on hover). In the preferences view it becomes Save choices, in the full style.
  - In Google's message, turn on the "Do not consent" button for every country. TCF doesn't require it, but the ICO, EDPB and CNIL expect a reject option on the first screen.
  - Google says consent rates are higher without it, but those regulators expect one.
- **Separate categories.** Our own banner has separate Analytics and Advertising toggles, both off by default.
- **Withdrawal on every page.** A footer link or floating icon reopens the banner on every page (TCF C(f)).
  - For visitors who saw Google's message, it calls `googlefc.showRevocationMessage()`.
  - For everyone else, it reopens our banner.
- **No cookie walls.** The site works fully after Reject.
- **Re-asking:**
  - About 6 months after a choice (ICO and CNIL suggestion).
  - When a new ad vendor is added (TCF).
  - Not more often.

## The delay

A delay is allowed, because TCF says the publisher decides "when the Framework UI will be shown". The cost: **every visit shorter than the delay gets no ads and no analytics.** It can be tuned per page.

- **Google's message:** call `proceed()` through `controlledMessagingFunction` when the delay ends. Google warns this "may delay ads serving", which is the expected cost.
- **Finding out who Google covers:** Google's tool only creates `__tcfapi`, and says whether GDPR applies, *after* `proceed()`. So:
  - A new visitor isn't sorted until the delay ends. Then we release Google's message and watch `__tcfapi`.
  - A visitor with a stored choice (our `consent` in localStorage, or Google's `FCCDCF` cookie) is sorted on load, so their choice applies straight away.
  - If `__tcfapi` doesn't appear, GDPR doesn't apply, or Google loads but sends no consent event (no message published, so `displayStatus: hidden`), our banner asks after `TCF_DETECT_TIMEOUT_MS` (4 s).
  - Found live on 7 Nov 2026: with no European message published, UK visitors were otherwise never asked.
- **Ads and analytics:** for every visitor, `adsbygoogle.js` loads only after a decision and gtag.js only after analytics consent. Ad slots queue their requests until then.
- **Test that Google's fallback message doesn't fire during the delay.** That's the "Allow Google to maximize message coverage" setting, and no timeout is documented.

There is no peer-reviewed study on delayed or contextual prompts. Utz et al. (CCS 2019, 82,890 visitors) found a small bottom-left notice got the most interaction (33%), against 9.6% for bottom bars and 2.9% for top bars.

## What was built

Everything stays off until the two build-time variables below are set. With neither set, no banner shows and nothing loads.

| Variable | Value | Effect |
|---|---|---|
| `NEXT_PUBLIC_ADSENSE_CLIENT` | `ca-pub-…` | Google's message for EEA, UK and Swiss visitors, and AdSense after a decision |
| `NEXT_PUBLIC_ADSENSE_SLOT_POST` | slot id | The ad at the end of each blog post |
| `NEXT_PUBLIC_ADSENSE_SLOT_TOOL` | slot id | The ad below the pitch graph and English IPA tools |
| `NEXT_PUBLIC_ADSENSE_SLOT_POST_MID` | slot id | Inside post pages of 800+ words, before the second h2 (`remarkMidAd` in `blog-client.ts`) |
| `NEXT_PUBLIC_ADSENSE_SLOT_POST_RAIL` | slot id | Under a post's table of contents, fixed 160×600, screens 1143px+ only |
| `NEXT_PUBLIC_ADSENSE_SLOT_IPA_RAIL` | slot id | At the end of the English IPA sound detail panel, fixed 300×250, screens 1120px+ only |

No ads on home, projects, post lists, privacy or 404: the portfolio pages stay clean, the lists are thin, and AdSense bars ads on error and no-content pages.
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-…` | GA4 after analytics consent |

These are inlined at build time. They're public ids, so they go in `.env.production`, which is committed and read by `next build` but not `next dev`, so local dev doesn't send visits to GA. Change them there and redeploy.

- **Ad placement:** an ad unit renders only after the visitor allows ads, so pages keep no empty gap without consent.
- **Site verification:** with `NEXT_PUBLIC_ADSENSE_CLIENT` set, the site also gets the `google-adsense-account` meta tag. AdSense needs it because its crawler never consents, so it never sees `adsbygoogle.js`.
- **`ads.txt`:** served at `/ads.txt` by `src/pages/api/ads-txt.page.ts`, built from the client id.

- **Logic:** `src/features/consent/`.
  - `config.ts` holds the ids, version, re-ask age and per-page options.
  - `consent.ts` holds the state and decisions.
  - `google.ts` wires up Google's message, GA4 and AdSense.
  - `headScript.ts` is the inline head script.
  - `choice.ts`, tested in `choice.test.ts`, holds the pure rules.
- **Head:** `_document` sets every Consent Mode signal to denied, holds Google's message, and loads Google's message tag (`fundingchoicesmessages.google.com`). The AdSense script itself (`adsbygoogle.js`) loads only after a decision.
- **Banner:** `src/components/organism/Consent/Consent.tsx`, rendered in `_app`, plus `ConsentSlot.tsx` for inline placement.
- **Per page:** pages set a static `consent` property, read through `AppPage` in `_app`:

  ```tsx
  PostPage.consent = { delayMs: 15000, placement: "inline", variant: "post" }
  ```

  Then put `<ConsentSlot />` where the inline banner should go. The delay restarts on each page. Google's message uses the same delay; `placement` and `variant` reach its CSS as `data-consent-placement` and `data-consent-variant` on `<html>`.
- **Google's message styling:** `src/styles/google-consent.css`. It hasn't been checked against the real message yet, since that needs a live AdSense account.
- **Ads:** `src/components/molecular/AdSenseBanner/AdSenseBanner.tsx` renders `<AdSenseBanner slot="…" />`.
- **Consent records:** `POST /api/consent` stores our banner's choices through the object store. Google keeps the records for its message.
- **Footer:** "Privacy and cookies" and "Cookie settings" links.
- **Privacy page:** `/privacy`, English only, built to need few edits.
  - Its Analytics and Ads sections show only when the matching env var is set, the same rule as the banner.
  - Cookie names and lifetimes aren't listed; it links to Google's own pages instead, including the "partner-sites" page AdSense requires.
  - Edit it only when adding a service, or when changing the GA retention or the contact address.
  - It states settings that must actually be made in GA4 (signals off, 2-month retention) and a 2-year retention for consent records.
  - It still needs the owner's review.
  - If counsel says KVKK applies (question 2 below), it may need a Turkish version.

### To verify while building

- Whether `gdprApplies` from Google's tool reliably tells us which banner to show.
- Whether the fallback message fires during a delay.
- Whether a late consent update makes GA4 send the `page_view` it missed. Check in DebugView.
- How Google's message behaves on client-side navigation in Next.js.

## Console settings

- **AdSense, Privacy & messaging → European regulations:**
  - **Messages:** create and publish the European regulations message for the site.
    - Buttons: Consent, Do not consent and Manage options.
    - Set the site's fonts and colours in the editor, as a base under our CSS.
  - **Add purposes for your own use:** add Purpose 1 (store and/or access information on a device), Purpose 8 (measure content performance) and Purpose 9 (understand audiences through statistics), each with **consent** as the legal basis. GA4 loads only when the visitor consents to all three. The code reads them from the TC string's publisher section (`ANALYTICS_PUBLISHER_PURPOSES` in `src/features/consent/config.ts`).
  - **Consent mode: off.** We send GA4's Consent Mode signal ourselves from the purposes above, so there is one source of truth.
  - **Ad partners:** fewer partners means a smaller vendor count on the banner, but Google calls its default set (198 partners) the highest-revenue ones. Start with the default.
  - **Legitimate interest:** controls off by default. Regulators reject legitimate interest for cookies, and Google says turning it off may cut revenue significantly.
  - **Special feature 2:** off.
  - **Allow Google to maximize message coverage:** off, unless testing shows the delay needs nothing from it. Our own message already covers the site.
- **GA4:**
  - Turn Google signals off.
  - Turn granular location and device data off for the EEA and UK.
  - Turn all data sharing settings off.
  - Set data retention to 2 months.
  - Don't link GA4 to Ads or AdSense.

## Owner admin

- **ICO data protection fee: very likely required.** A site that earns from ads isn't "personal, family or household". Tier 1 is £52 a year, or £47 by direct debit. Confirm with the [self-assessment](https://ico.org.uk/for-organisations/data-protection-fee/self-assessment/).
- **Transfers to Google:** nothing to sign. Google's ads data terms cover UK GDPR, and Google relies on the UK–US data bridge.

## Open questions for counsel

1. **EU representative (GDPR Art 27).** Tracking EU visitors' behaviour brings the site under GDPR Art 3(2), and every-visit tracking isn't "occasional". Enforcement against a personal site is unlikely, but not zero: the Dutch regulator fined Locatefamily.com €525k in 2021 for having no representative.
2. **Turkish law (KVKK) and its registry (VERBİS).** KVKK has no territorial clause, but its cookie guide addresses "all data controllers operating websites", and the site has Turkish pages. Secondary sources say controllers outside Turkey must register in VERBİS through a representative regardless of size. I didn't verify this.

## Things to watch

- **Google's `.fc-*` markup changes:** these break our styling. Look at the banner after each change.
- **EU Digital Omnibus:** it would rewrite ePrivacy Art 5(3). The Council's 21 Oct 2026 position still requires consent for third-party analytics. Nothing is law yet.
- **AdSense "Optimize my consent message" (May 2026):** turn it off if it appears. I only know it from secondary sources.

## Main sources

- TCF:
  - [IAB TCF Policies v5.0.b](https://iabeurope.eu/iab-europe-transparency-consent-framework-policies/): Appendix B A(b) on timing, C(a) on placement, C(f) on reopening, C(g) on buttons.
- Google:
  - [Funding Choices API: controlledMessagingFunction, showRevocationMessage](https://developers.google.com/funding-choices/fc-api-docs)
  - [AdSense: message styling](https://support.google.com/adsense/answer/10958856)
  - [AdSense: Consent Mode from Privacy & messaging](https://support.google.com/adsense/answer/16053245)
  - [AdSense: certified CMP requirement and limited ads](https://support.google.com/adsense/answer/14210870)
  - [AdSense: fallback consent message](https://support.google.com/adsense/answer/17341119)
  - [AdSense: pausing ad requests](https://support.google.com/adsense/answer/9042142)
  - [GA4: Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- UK:
  - [ICO: exceptions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)
  - [ICO: managing consent](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-manage-consent-in-practice/)
- EU:
  - [EDPB cookie banner taskforce report](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf)
- Turkey:
  - [KVKK cookie guide](https://kvkk.gov.tr/Icerik/7353/Cerez-Uygulamalari-Hakkinda-Rehber)
