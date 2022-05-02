import ErrorPage from "@/components/template/ErrorPage/ErrorPage"
import { COMMON_TNS } from "@/lib/i18n/consts"
import { DEFAULT_LOCALE } from "@/lib/utils/consts"
import { GetStaticProps, NextPage } from "next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { useTranslation } from "react-i18next"

export const getStaticProps: GetStaticProps = async (ctx) => {
   const { locale = DEFAULT_LOCALE } = ctx

   return {
      props: {
         ...(await serverSideTranslations(locale, [COMMON_TNS])),
      },
   }
}

const Error404Page: NextPage = () => {
   const { t } = useTranslation()

   return <ErrorPage code={404}>{t("page not found")}.</ErrorPage>
}

export default Error404Page
