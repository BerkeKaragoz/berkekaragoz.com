import { PostMeta } from "@/lib/api/blog-common"
import { COMMON_TNS, GLOSSARY_TNS, PAGES_TNS } from "@/lib/i18n/consts"
import { estimateReadingMinutes } from "@/lib/utils"
import { DEFAULT_LOCALE, placeholderBlurBase64 } from "@/lib/utils/consts"
import { useTranslation } from "next-i18next"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import styles from "./Posts.module.css"

type PostTileProps = {
   post: PostMeta
   featured?: boolean
}

/** The cover, or the post's first tag set large when it has none. */
const Cover: React.FC<PostTileProps> = ({ post, featured }) => {
   const { t: gt } = useTranslation(GLOSSARY_TNS)
   return (
      <div className={`${styles.cover} ${featured ? styles.coverFeatured : ""}`}>
         {featured && <span className={styles.badge}>{gt("latest")}</span>}
         {post.coverSrc ? (
            <Image
               src={post.coverSrc}
               alt=""
               fill
               sizes={
                  featured
                     ? "(min-width: 1024px) 480px, 100vw"
                     : "(min-width: 1024px) 224px, (min-width: 640px) 50vw, 120px"
               }
               className={styles.image}
               placeholder="blur"
               quality={60}
               blurDataURL={post.coverBlurDataURL ?? placeholderBlurBase64}
            />
         ) : (
            <span className={styles.tagCover} aria-hidden="true">
               #{post.tags[0] ?? "post"}
            </span>
         )}
      </div>
   )
}

const PostTile: React.FC<PostTileProps> = ({ post, featured }) => {
   const { t: ct, i18n } = useTranslation(COMMON_TNS)
   const locale = i18n.language ?? DEFAULT_LOCALE
   const date = new Date(post.date)

   return (
      <Link
         href={`/p/${post.slug}`}
         className={`unstyled-a ${styles.tile} ${featured ? styles.featured : ""}`}
      >
         <article className={`card-input ${styles.body}`}>
            <Cover post={post} featured={featured} />
            <div className={styles.text}>
               <p className={`${styles.meta} text-subtitle-color`}>
                  <time dateTime={date.toISOString()}>
                     {date.toLocaleDateString(locale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                     })}
                  </time>
                  {` · ${estimateReadingMinutes(post.wordCount)} ${ct("min read")}`}
                  {post.pages.length > 1 && ` · ${post.pages.length} ${ct("pages")}`}
               </p>
               <h3 className={`${styles.title} text-caption-color`}>{post.title}</h3>
               {featured && (
                  <>
                     <p className={`${styles.excerpt} text-subtitle-color`}>
                        {post.excerpt}
                     </p>
                     <p className={`${styles.tags} text-subtitle-color`}>
                        {post.tags.slice(0, 5).map((tag) => (
                           <span key={tag} className={styles.tag}>
                              #{tag}
                           </span>
                        ))}
                     </p>
                  </>
               )}
            </div>
         </article>
      </Link>
   )
}

type PostsProps = {
   /** Newest first; the first is featured. */
   posts: PostMeta[]
   postCount: number
}

const Posts: React.FC<PostsProps> = ({ posts, postCount }) => {
   const { t } = useTranslation(PAGES_TNS)
   if (!posts.length) return null
   const [featured, ...rest] = posts

   return (
      <div className="w-full max-w-5xl py-12 mx-auto">
         <h2 className="text-3xl font-semibold text-center text-caption-color">
            {t("index.posts.title")}
         </h2>
         {/* On a blue band cards sit in a darker well, like Experience. */}
         <div
            className={`${styles.bento} p-2 my-8 rounded-lg dark:bg-black dark:bg-opacity-20`}
         >
            <PostTile post={featured} featured />
            {rest.map((post) => (
               <PostTile key={post.slug} post={post} />
            ))}
         </div>
         <p className="text-center">
            <Link href="/posts">
               {t("index.posts.seeAll", { count: postCount })}
            </Link>
         </p>
      </div>
   )
}

export default Posts
