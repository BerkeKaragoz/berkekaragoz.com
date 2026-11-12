import Main from "@/components/atomic/Main/Main"
import Section from "@/components/atomic/Section/Section"
import PlusBand from "@/components/molecular/PlusBand/PlusBand"
import Footer from "@/components/organism/Footer/Footer"
import Header from "@/components/organism/Header/Header"
import { CONSENT_NEEDED } from "@/features/consent/config"
import { OFFERED, openConsentSettings } from "@/features/consent/consent"
import { COMMON_TNS, PAGES_TNS } from "@/lib/i18n/consts"
import { DEFAULT_LOCALE } from "@/lib/utils/consts"
import { GetStaticProps, NextPage } from "next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import Head from "next/head"
import React from "react"

// The privacy notice, in English only (a UK notice needs no translation).
// Written to need few edits: the Google sections follow the same env vars as
// the consent banner, and cookie names and lifetimes are left to Google's own
// pages, which Google keeps current. Edit it only when adding a service,
// changing the GA retention setting or the contact address, and then update
// LAST_UPDATED.

const LAST_UPDATED = "6 November 2026"
const CONTACT = "mail@berkekaragoz.com"
const GA_RETENTION = "2 months"

const LINKS = {
   // AdSense program policies require linking this page.
   googlePartnerSites: "https://policies.google.com/technologies/partner-sites",
   googleAdsCookies: "https://policies.google.com/technologies/ads",
   gaCookies: "https://support.google.com/analytics/answer/11397207",
   adsSettings: "https://adssettings.google.com",
   ico: "https://ico.org.uk/make-a-complaint/",
}

const A: React.FC<{ href: string; children: React.ReactNode }> = (props) => (
   <a className="link" href={props.href} rel="noreferrer" target="_blank">
      {props.children}
   </a>
)

const Mail: React.FC = () => (
   <a className="link" href={`mailto:${CONTACT}`}>
      {CONTACT}
   </a>
)

type Part = { title: string; body: React.ReactNode[]; when?: boolean }

const PARTS: Part[] = [
   {
      title: "Who runs this site",
      body: [
         <>
            berkekaragoz.com is run by E. Berke Karagöz, in the United Kingdom, who decides
            how the data below is used. Contact: <Mail />.
         </>,
      ],
   },
   {
      title: "Analytics",
      when: OFFERED.analytics,
      body: [
         `With your consent, Google Analytics counts visits: which pages are read, roughly from which country, on what kind of device. It also records one event when the pitch graph has been in use for two minutes; the event says only that this happened and includes no audio. Google acts as my processor. Google signals, data sharing and ads linking are off, and the data is kept for ${GA_RETENTION}.`,
         <>
            The cookies it sets are listed in{" "}
            <A href={LINKS.gaCookies}>Google Analytics cookie usage</A>.
         </>,
      ],
   },
   {
      title: "Ads",
      when: OFFERED.ads,
      body: [
         <>
            With your consent, Google AdSense shows ads. Third-party vendors, including
            Google, use cookies to serve ads based on your prior visits to this website
            or other websites. Google&apos;s use of advertising cookies enables it and its
            partners to serve ads to you based on your visits to this site and/or other
            sites on the Internet. Google and its partners decide this as independent
            controllers.
         </>,
         <>
            See <A href={LINKS.googlePartnerSites}>how Google uses information from sites that use its services</A>{" "}
            and <A href={LINKS.googleAdsCookies}>the cookies Google uses for ads</A>. You
            can opt out of personalised advertising in{" "}
            <A href={LINKS.adsSettings}>Google&apos;s Ads Settings</A>.
         </>,
         "Visitors in the EEA, the UK and Switzerland are asked through Google's consent message, which follows the IAB Transparency and Consent Framework; if you decline there, Google may still show ads that are not personalised. Everyone else is asked through this site's own banner, and if you decline, no ads load.",
      ],
   },
   {
      title: "Your choice",
      when: CONSENT_NEEDED,
      body: [
         "Nothing from Google Analytics or AdSense loads before you choose, and you can change your mind at any time with the button above or the \"Cookie settings\" link at the bottom of every page.",
         "Your choice is kept in your browser so you are not asked on every page, and you are asked again after about 6 months. When you answer this site's own banner, a record is also kept on the server: a random id, what you chose, when, and the page language. It has no IP address and is kept for 2 years to show that consent was given.",
      ],
   },
   {
      title: "Everything else",
      body: [
         "Some pages keep settings or cached data in your browser, such as your light or dark theme. It stays on your device and is never sent anywhere.",
         "The site is served through Cloudflare, which handles your IP address to deliver pages and protect the site. Fonts load from Google Fonts, which also receives your IP address. Post comments use giscus, which stores comments in GitHub Discussions; posting one needs a GitHub account.",
         "When a test build of one of my apps checks in with this site, the IP address, user agent, referrer and query of that check-in are stored to follow the test. Ordinary visits to this site are not stored.",
      ],
   },
   {
      title: "Legal basis and transfers",
      body: [
         "Analytics and ads rely on your consent (UK GDPR Art 6(1)(a) and PECR). Hosting, security, fonts and app check-ins rely on legitimate interests (Art 6(1)(f)): running the site and its apps safely. Google and Cloudflare may process data in the United States, under the UK–US data bridge and their data processing terms.",
      ],
   },
   {
      title: "Your rights",
      body: [
         <>
            You can ask for a copy of your data, to correct or delete it, to restrict or
            object to its use, or to move it, and you can withdraw consent at any time.
            Write to <Mail />. You can also complain to the{" "}
            <A href={LINKS.ico}>Information Commissioner&apos;s Office</A>.
         </>,
      ],
   },
]

const PrivacyPage: NextPage = () => (
   <div>
      <Head>
         <title>Privacy and cookies | Berke Karagöz</title>
      </Head>
      <Header />
      <Main>
         <PlusBand className="h-24" />
         <Section className="flex-col py-8">
            <div lang="en">
               <h1 className="text-4xl font-semibold text-caption-color">
                  Privacy and cookies
               </h1>
               <p className="mt-2 text-sm opacity-70">Last updated {LAST_UPDATED}.</p>
               {CONSENT_NEEDED && (
                  <p className="mt-4">
                     <button
                        type="button"
                        className="px-3 py-1.5 text-sm font-medium card-input enabled:!bg-background-50 dark:enabled:!bg-background-700 enabled:text-primary-700 enabled:hover:text-primary-800"
                        onClick={openConsentSettings}
                     >
                        Change your cookie choices
                     </button>
                  </p>
               )}
               <div className="mt-6 space-y-8 max-w-prose">
                  {PARTS.filter((part) => part.when !== false).map((part) => (
                     <section key={part.title}>
                        <h2 className="mb-2 text-xl font-semibold text-caption-color">
                           {part.title}
                        </h2>
                        <div className="space-y-3">
                           {part.body.map((paragraph, i) => (
                              <p key={i}>{paragraph}</p>
                           ))}
                        </div>
                     </section>
                  ))}
               </div>
            </div>
         </Section>
      </Main>
      <Footer />
   </div>
)

export const getStaticProps: GetStaticProps = async ({ locale = DEFAULT_LOCALE }) => ({
   props: {
      ...(await serverSideTranslations(locale, [PAGES_TNS, COMMON_TNS])),
   },
})

export default PrivacyPage
