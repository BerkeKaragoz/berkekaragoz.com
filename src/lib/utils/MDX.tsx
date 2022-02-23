import { MDXRemoteProps } from "next-mdx-remote";
import Image from "next/image";

export const AppMDXComponents: MDXRemoteProps["components"] = {
  Image: (props) => (
    <div className="mx-auto text-center">
      <Image alt={props.alt} {...props} />
    </div>
  ),
  p: (props) => <p className="mb-2" {...props} />,
  h1: (props) => <h1 className="h1" {...props} />,
  h2: (props) => <h2 className="h2" {...props} />,
  h3: (props) => <h3 className="h3" {...props} />,
  h4: (props) => <h4 className="h4" {...props} />,
  h5: (props) => <h5 className="h5" {...props} />,
  ul: (props) => <ul className="ul" {...props} />,
  ol: (props) => <ol className="ol" {...props} />,
  li: (props) => <li className="li" {...props} />,
  pre: (props) => (
    <pre className="p-1 mb-2 overflow-hidden rounded-md card" {...props} />
  ),
};
