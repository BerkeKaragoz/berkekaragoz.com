import { getPostPageHref, PostMeta, PostPageMeta } from "@/lib/api/blog-common"
import { COMMON_TNS } from "@/lib/i18n/consts"
import { estimateReadingMinutes } from "@/lib/utils"
import { cn } from "@shortkit/cn"
import { useTranslation } from "next-i18next"
import Link from "next/link"

type PostNavProps = {
   meta: PostMeta
   currentPageSlug: string
   onNavigate?: () => void
   className?: string
}

/** Collapses consecutive pages that share a group into one block */
const groupPostPages = (pages: PostPageMeta[]) =>
   pages.reduce<{ group: string | null; pages: PostPageMeta[] }[]>(
      (groups, page) => {
         const last = groups[groups.length - 1]

         if (last && last.group === page.group) last.pages.push(page)
         else groups.push({ group: page.group, pages: [page] })

         return groups
      },
      []
   )

export const PostNav = ({
   meta,
   currentPageSlug,
   onNavigate,
   className,
}: PostNavProps) => {
   const { t } = useTranslation([COMMON_TNS])

   if (meta.pages.length < 2) return null

   const groups = groupPostPages(meta.pages)

   return (
      <div className={className}>
         <Link
            href={`/p/${meta.slug}`}
            onClick={onNavigate}
            className="block font-medium leading-snug transition-colors text-background-900 hover:text-secondary-700 dark:text-background-100 dark:hover:text-secondary-400"
         >
            {meta.title}
         </Link>
         <p className="mt-1 mb-5 text-xs text-background-500 dark:text-background-400">
            {`${meta.pages.length} ${t("pages")} • ${estimateReadingMinutes(
               meta.wordCount
            )} ${t("min read")}`}
         </p>

         {groups.map((group, groupIndex) => (
            <div key={group.group ?? `ungrouped-${groupIndex}`} className="mb-5">
               {group.group && (
                  <p className="mb-1 text-xs tracking-wide uppercase-first text-background-500 dark:text-background-400">
                     {group.group}
                  </p>
               )}
               <ul className="text-sm border-s border-background-300 dark:border-background-700">
                  {group.pages.map((page) => {
                     const isActive = page.slug === currentPageSlug

                     return (
                        <li key={page.slug}>
                           <Link
                              href={getPostPageHref(meta.slug, page.slug)}
                              onClick={onNavigate}
                              aria-current={isActive ? "page" : undefined}
                              className={cn(
                                 "block py-1 ps-3 -ms-px border-s-2 transition-colors",
                                 isActive
                                    ? "border-primary-600 text-primary-700 font-medium dark:border-primary-400 dark:text-primary-300"
                                    : "border-transparent text-background-600 hover:text-secondary-700 dark:text-background-300 dark:hover:text-secondary-400"
                              )}
                           >
                              {page.title}
                           </Link>
                        </li>
                     )
                  })}
               </ul>
            </div>
         ))}
      </div>
   )
}

export default PostNav
