import { TocItem } from "@/lib/api/blog-common"
import { COMMON_TNS } from "@/lib/i18n/consts"
import { cn } from "@shortkit/cn"
import { useTranslation } from "next-i18next"

type PostTocProps = {
   toc: TocItem[]
   activeId: string | null
   onNavigate?: () => void
   /** The sheet supplies its own title */
   showHeading?: boolean
   className?: string
}

export const PostToc = ({
   toc,
   activeId,
   onNavigate,
   showHeading = true,
   className,
}: PostTocProps) => {
   const { t } = useTranslation([COMMON_TNS])

   if (toc.length === 0) return null

   return (
      <div className={className}>
         {showHeading && (
            <p className="mb-2 text-xs tracking-wide uppercase-first text-subtitle-color opacity-60">
               {t("on this page")}
            </p>
         )}
         <ul className="text-sm border-s border-background-300 border-opacity-50 dark:border-background-700">
            {toc.map((item) => {
               const isActive = item.id === activeId

               return (
                  <li key={item.id}>
                     <a
                        href={`#${item.id}`}
                        onClick={onNavigate}
                        aria-current={isActive ? "location" : undefined}
                        className={cn(
                           "block py-1 -ms-px border-s-2 transition-colors hover:text-primary-500",
                           item.depth === 3 ? "ps-6" : "ps-3",
                           isActive
                              ? "border-primary-500 text-primary-600 dark:text-primary-400"
                              : "border-transparent text-subtitle-color opacity-70"
                        )}
                     >
                        {item.text}
                     </a>
                  </li>
               )
            })}
         </ul>
      </div>
   )
}

export default PostToc
