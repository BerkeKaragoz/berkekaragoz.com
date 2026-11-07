import { COMMON_TNS, PAGES_TNS } from "@/lib/i18n/consts"
import { DEFAULT_LOCALE } from "@/lib/utils/consts"
import { GetStaticProps } from "next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { PITCH_TNS } from "./i18n"

export const getPitchStaticProps = async (ctx: Parameters<GetStaticProps>[0]) => {
   const { locale = DEFAULT_LOCALE } = ctx

   return {
      props: {
         ...(await serverSideTranslations(locale, [
            PITCH_TNS,
            COMMON_TNS,
            PAGES_TNS,
         ])),
      },
   }
}
