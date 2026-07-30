import { COMMON_TNS, PAGES_TNS } from "@/lib/i18n/consts"
import { DEFAULT_LOCALE } from "@/lib/utils/consts"
import { GetStaticProps } from "next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { IPA_TNS } from "./i18n"

export const getIpaStaticProps = async (ctx: Parameters<GetStaticProps>[0]) => {
   const { locale = DEFAULT_LOCALE } = ctx

   return {
      props: {
         ...(await serverSideTranslations(locale, [IPA_TNS, COMMON_TNS, PAGES_TNS])),
      },
   }
}
