import LinkText from "@/components/atomic/LinkText/LinkText";
import { PostMeta } from "@/lib/api/blog";
import { COMMON_TNS } from "@/lib/i18n/consts";
import { ComponentPropsWithActiveTranslation } from "@/lib/types/i18n";
import { estimateReadingMinutes } from "@/lib/utils";
import { DEFAULT_LOCALE } from "@/lib/utils/consts";
import React from "react";
import { useTranslation, withTranslation } from "react-i18next";

type PostListProps = ComponentPropsWithActiveTranslation<{
  postMetas: PostMeta[];
}>;

export const PostList: React.FC<PostListProps> = (props) => {
  const { postMetas, i18n } = props;
  const locale = i18n.language ?? DEFAULT_LOCALE;

  const { t: ct } = useTranslation([COMMON_TNS]);

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
                {new Date(post.date).toLocaleDateString(locale)}
              </span>
              <span className="inline-block ml-1 opacity-50 text-subtitle-color">
                {`• ${estimateReadingMinutes(post.wordCount)} ${ct(
                  "min read",
                )}`}
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

export default withTranslation(COMMON_TNS)(PostList);
