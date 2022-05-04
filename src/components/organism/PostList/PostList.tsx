import PostCard from "@/components/molecular/PostCard/PostCard"
import { PostMeta } from "@/lib/api/blog"
import { COMMON_TNS } from "@/lib/i18n/consts"
import { ComponentPropsWithActiveTranslation } from "@/lib/types/i18n"
import React from "react"
import { withTranslation } from "react-i18next"

type PostListProps = ComponentPropsWithActiveTranslation<{
   postMetas: PostMeta[]
}>

export const PostList: React.FC<PostListProps> = (props) => {
   const { postMetas } = props

   return (
      <ul className="grid grid-cols-1 gap-8 mt-4 md:grid-cols-2">
         {postMetas.map((post) => (
            <PostCard key={`${post.slug}`} postMeta={post} />
         ))}
      </ul>
   )
}

export default withTranslation(COMMON_TNS)(PostList)
