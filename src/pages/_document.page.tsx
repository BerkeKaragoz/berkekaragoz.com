import Document, {
   DocumentContext,
   Head,
   Html,
   Main,
   NextScript,
} from "next/document"
import { ADSENSE_CLIENT, CONSENT_NEEDED } from "@/features/consent/config"
import {
   CONSENT_HEAD_SCRIPT,
   GOOGLE_FC_PRESENT_SCRIPT,
   googleMessageSrc,
} from "@/features/consent/headScript"

const FONT_LINK_HREF =
   "https://fonts.googleapis.com/css2?family=Saira:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Source+Code+Pro:ital,wght@0,400;0,700;1,400;1,700&display=swap"

class MyDocument extends Document {
   static getInitialProps = async (ctx: DocumentContext) => {
      const initialProps = await Document.getInitialProps(ctx)

      return initialProps
   }

   render = () => (
      <Html>
         <Head>
            {CONSENT_NEEDED && (
               <script dangerouslySetInnerHTML={{ __html: CONSENT_HEAD_SCRIPT }} />
            )}
            {ADSENSE_CLIENT && (
               <>
                  {/* Lets AdSense verify the site: its crawler never consents, so it never sees adsbygoogle.js. */}
                  <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
                  <script async src={googleMessageSrc(ADSENSE_CLIENT)} />
                  <script dangerouslySetInnerHTML={{ __html: GOOGLE_FC_PRESENT_SCRIPT }} />
               </>
            )}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="icon" href="/favicon.ico" />

            <link href={FONT_LINK_HREF} rel="stylesheet" />
         </Head>
         <body>
            <Main />
            <NextScript />
         </body>
      </Html>
   )
}

export default MyDocument
