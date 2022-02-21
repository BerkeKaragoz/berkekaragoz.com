import LinkText from "@/components/atomic/LinkText/LinkText";
import { PostMeta } from "@/lib/api/blog";
import React from "react";

export const PostList: React.FC<{ postMetas: PostMeta[] }> = (props) => {
  const { postMetas } = props;

  return (
    <ul className="grid grid-cols-1 gap-8 mt-4 md:grid-cols-2">
      {postMetas.map((post, i) => (
        <li
          key={`li-${post.slug}-${i}`}
          className="flex flex-col justify-between p-2 card"
        >
          <div>
            <LinkText href={`/p/${post.slug}`} className="me-2 h3">
              {post.title}
            </LinkText>
            <div className="inline-block">
              <span className="text-subtitle-color">
                {new Date(post.date).toLocaleDateString()}
              </span>
              <span className="hidden ml-2 text-sm sm:inline-block text-subtitle-color opacity-40">
                {`/p/${post.slug}`}
              </span>
            </div>
          </div>
          <p className="my-1 text-subtitle-color max-w-prose">{post.excerpt}</p>
          <p>
            {post.tags.map((tag, i) => (
              <>
                <LinkText key={tag} href={`/posts/${tag}`}>
                  {`#${tag}`}
                </LinkText>
                {i !== post.tags.length - 1 && `, `}
              </>
            ))}
          </p>
        </li>
      ))}
    </ul>
  );
};

export default PostList;
