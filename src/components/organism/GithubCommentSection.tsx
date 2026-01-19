"use client"

import { useEffect, useState } from "react"
import Giscus from "@giscus/react"
import { giscusConfig, validateGiscusConfig } from "@/config/giscus"
import { useTheme } from "next-themes"
import { cn } from "@shortkit/cn"
import { useTranslation } from "next-i18next"

type GithubCommentProps = {
   disableReactions?: boolean
}

const GithubComment = ({ disableReactions = false }) => {
   const [mounted, setMounted] = useState(false)
   const { theme = "dark" } = useTheme()
   const { i18n } = useTranslation()

   useEffect(() => void setMounted(true), [])

   if (!mounted)
      return (
         <div className="min-h-[200px] w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800">
            <div className="flex h-[200px] items-center justify-center text-slate-400">
               Loading comments...
            </div>
         </div>
      )

   const isValid = validateGiscusConfig()

   if (!isValid) return null

   const giscusTheme = theme === "dark" ? "transparent_dark" : "noborder_light"

   return (
      <Giscus
         repo={giscusConfig.repo}
         repoId={giscusConfig.repoId}
         category={giscusConfig.category}
         categoryId={giscusConfig.categoryId}
         mapping={giscusConfig.mapping}
         strict={giscusConfig.strict}
         reactionsEnabled={disableReactions ? "0" : giscusConfig.reactionsEnabled}
         emitMetadata={giscusConfig.emitMetadata}
         inputPosition={giscusConfig.inputPosition}
         theme={giscusTheme}
         lang={i18n.language.slice(0, 2) || giscusConfig.lang}
         loading={giscusConfig.loading}
      />
   )
}

export const GithubCommentSection = ({
   className,
   ...rest
}: GithubCommentProps & { className?: string }) => {
   const isValid = validateGiscusConfig()

   if (!isValid) {
      if (process.env.NODE_ENV === "development")
         return (
            <div>
               <strong>Warning:</strong> Giscus configuration is incomplete.
            </div>
         )

      return null
   }

   return (
      <section
         aria-label="Comments section"
         className={cn("mx-auto w-full max-w-prose", className)}
      >
         <GithubComment {...rest} />
      </section>
   )
}
