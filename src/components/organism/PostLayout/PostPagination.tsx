import { getPostPageHref, PostMeta } from "@/lib/api/blog-common"
import { COMMON_TNS } from "@/lib/i18n/consts"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/solid"
import { useTranslation } from "next-i18next"
import Link from "next/link"

type PostPaginationProps = {
   meta: PostMeta
   currentPageSlug: string
   className?: string
}

export const PostPagination = ({
   meta,
   currentPageSlug,
   className,
}: PostPaginationProps) => {
   const { t } = useTranslation([COMMON_TNS])

   const index = meta.pages.findIndex((page) => page.slug === currentPageSlug)

   if (meta.pages.length < 2 || index === -1) return null

   const previous = index > 0 ? meta.pages[index - 1] : null
   const next = index < meta.pages.length - 1 ? meta.pages[index + 1] : null

   return (
      <nav className={className} aria-label={t("pages")}>
         <div className="flex gap-3">
            {previous && (
               <Link
                  href={getPostPageHref(meta.slug, previous.slug)}
                  className="flex-1 p-3 text-start card-input"
                  rel="prev"
               >
                  <span className="flex items-center gap-1 text-xs uppercase-first text-subtitle-color opacity-60">
                     <ChevronLeftIcon className="w-4 h-4 rtl:rotate-180" />
                     {t("previous")}
                  </span>
                  <span className="block mt-0.5">{previous.title}</span>
               </Link>
            )}
            {next && (
               <Link
                  href={getPostPageHref(meta.slug, next.slug)}
                  className="flex-1 p-3 text-end card-input"
                  rel="next"
               >
                  <span className="flex items-center justify-end gap-1 text-xs uppercase-first text-subtitle-color opacity-60">
                     {t("next")}
                     <ChevronRightIcon className="w-4 h-4 rtl:rotate-180" />
                  </span>
                  <span className="block mt-0.5">{next.title}</span>
               </Link>
            )}
         </div>
      </nav>
   )
}

export default PostPagination
