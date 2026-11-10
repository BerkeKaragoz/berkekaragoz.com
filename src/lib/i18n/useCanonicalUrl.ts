import { HOST_URL } from "@/lib/utils/consts"
import { useRouter } from "next/router"

/**
 * The canonical URL of a translated page. Each language is its own page, so
 * each one is its own canonical. `path` is the route without a locale, e.g.
 * "/about".
 */
export const useCanonicalUrl = (path: string) => {
   const { locale, defaultLocale } = useRouter()
   const localePath = locale && locale !== defaultLocale ? `/${locale}` : ""
   return `${HOST_URL}${localePath}${path}`
}
