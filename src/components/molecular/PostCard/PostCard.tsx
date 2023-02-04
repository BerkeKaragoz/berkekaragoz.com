import LinkText from "@/components/atomic/LinkText/LinkText"
import { PostMeta } from "@/lib/api/blog"
import { COMMON_TNS } from "@/lib/i18n/consts"
import { ComponentPropsWithActiveTranslation } from "@/lib/types/i18n"
import { estimateReadingMinutes } from "@/lib/utils"
import { DEFAULT_LOCALE } from "@/lib/utils/consts"
import React from "react"
import { useTranslation, withTranslation } from "react-i18next"

type PostCardProps = ComponentPropsWithActiveTranslation<{
   postMeta: PostMeta
   disableSlug?: boolean
   as?: React.ElementType
   className?: string
}>

export const PostCard: React.FC<PostCardProps> = (props) => {
   const {
      postMeta,
      as: Component = "div",
      disableSlug = false,
      i18n,
      className,
   } = props
   const locale = i18n.language ?? DEFAULT_LOCALE

   const { t: ct } = useTranslation([COMMON_TNS])

   return (
      <Component className={"flex flex-col justify-between p-2 card " + className}>
         <div>
            <LinkText href={`/p/${postMeta.slug}`} className="me-2 h3">
               {postMeta.title}
            </LinkText>
            <div className="inline-block">
               <span className="text-subtitle-color">
                  {new Date(postMeta.date).toLocaleDateString(locale)}
               </span>
               <span className="inline-block ml-1 opacity-60 text-subtitle-color">
                  {`• ${estimateReadingMinutes(postMeta.wordCount)} ${ct(
                     "min read"
                  )}`}
               </span>
               {!disableSlug && (
                  <span className="hidden ml-2 text-sm sm:inline-block text-subtitle-color opacity-30">
                     {`/p/${postMeta.slug}`}
                  </span>
               )}
            </div>
         </div>
         <p className="my-1 text-subtitle-color max-w-prose">{postMeta.excerpt}</p>
         <p>
            {postMeta.tags.map((tag, i) => (
               <span key={`${tag}-${postMeta.slug}`}>
                  <LinkText href={`/posts/${tag}`}>{`#${tag}`}</LinkText>
                  {i !== postMeta.tags.length - 1 && `, `}
               </span>
            ))}
         </p>
      </Component>
   )
}

export default withTranslation(COMMON_TNS)(PostCard)
