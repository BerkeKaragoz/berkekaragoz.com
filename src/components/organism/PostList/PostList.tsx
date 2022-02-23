import LinkText from "@/components/atomic/LinkText/LinkText";
import { PostMeta } from "@/lib/api/blog";
import { estimateReadingMinutes } from "@/lib/utils";
import React from "react";

export const PostList: React.FC<{ postMetas: PostMeta[] }> = (props) => {
  const { postMetas } = props;

  return (
    <ul className="grid grid-cols-1 gap-8 mt-4 md:grid-cols-2">
      {postMetas.map((post, i) => (
        <li
          key={`${post.slug}`}
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
              <span className="inline-block ml-1 opacity-50 text-subtitle-color">
                {`• ${estimateReadingMinutes(post.wordCount)} min read`}
              </span>
              <span className="hidden ml-2 text-sm sm:inline-block text-subtitle-color opacity-30">
                {`/p/${post.slug}`}
              </span>
            </div>
          </div>
          <p className="my-1 text-subtitle-color max-w-prose">{post.excerpt}</p>
          <p>
            {post.tags.map((tag, i) => (
              <span key={`${tag}-${post.slug}`}>
                <LinkText href={`/posts/${tag}`}>{`#${tag}`}</LinkText>
                {i !== post.tags.length - 1 && `, `}
              </span>
            ))}
          </p>
        </li>
      ))}
    </ul>
  );
};

export default PostList;
