import { PostMeta, TocItem } from "@/lib/api/blog-common"
import { COMMON_TNS } from "@/lib/i18n/consts"
import { ViewListIcon } from "@heroicons/react/solid"
import { useTranslation } from "next-i18next"
import { ReactNode, useCallback, useState } from "react"
import PostNav from "./PostNav"
import PostNavSheet from "./PostNavSheet"
import PostToc from "./PostToc"
import useScrollSpy from "./useScrollSpy"

type PostLayoutProps = {
   meta: PostMeta
   currentPageSlug: string
   toc: TocItem[]
   children: ReactNode
}

/** Article column, with a page rail and a contents rail beside it */
export const PostLayout = ({
   meta,
   currentPageSlug,
   toc,
   children,
}: PostLayoutProps) => {
   const { t } = useTranslation([COMMON_TNS])

   const [isPageSheetOpen, setPageSheetOpen] = useState(false)

   const activeId = useScrollSpy(toc)

   const hasPages = meta.pages.length > 1
   const hasToc = toc.length > 0

   const closeSheet = useCallback(() => setPageSheetOpen(false), [])

   const pageIndex = meta.pages.findIndex((page) => page.slug === currentPageSlug)

   return (
      <>
         {hasPages && (
            <div className="sticky z-10 border-b top-14 lg:hidden border-primary-200 border-opacity-40 dark:border-primary-900 dark:border-opacity-20 bg-background-100 bg-opacity-70 dark:bg-background-900 dark:bg-opacity-80 backdrop-blur-lg">
               <div className="flex items-center gap-2 px-4 py-2 mx-auto sm:px-8 max-w-screen-2xl">
                  <button
                     onClick={() => setPageSheetOpen(true)}
                     className="flex items-center gap-1.5 px-2 py-1 text-sm card-input"
                  >
                     <ViewListIcon className="w-4 h-4" />
                     {t("menu")}
                  </button>
               </div>
            </div>
         )}

         <div className="mx-auto max-w-screen-2xl lg:px-8">
            <div className="post-layout">
               <aside className="post-rail">
                  {hasPages && (
                     <nav aria-label={meta.title} className="post-panel">
                        <PostNav meta={meta} currentPageSlug={currentPageSlug} />
                     </nav>
                  )}
               </aside>

               <div className="min-w-0">
                  <div className="rounded-none card-backdrop md:py-4 md:px-4 lg:rounded-lg">
                     {children}
                  </div>
               </div>

               <aside className="post-rail">
                  {hasToc && (
                     <nav aria-label={t("on this page")} className="post-panel">
                        <PostToc toc={toc} activeId={activeId} />
                     </nav>
                  )}
               </aside>
            </div>
         </div>

         <PostNavSheet
            open={isPageSheetOpen}
            onClose={closeSheet}
            title={t("pages")}
         >
            <PostNav
               meta={meta}
               currentPageSlug={currentPageSlug}
               onNavigate={closeSheet}
            />
         </PostNavSheet>

      </>
   )
}

export default PostLayout
