import { MDXRemote, MDXRemoteProps } from "next-mdx-remote"
import Image from "next/image"

export const AppMDXComponents: MDXRemoteProps["components"] = {
   Image: (props) => (
      <div className="mx-auto mb-4 text-center justify-items-center">
         <Image alt={props.alt} {...props} />
      </div>
   ),
   p: (props) => <p className="mb-8" {...props} />,
   h1: (props) => <h1 className="h1" {...props} />,
   h2: (props) => <h2 className="h2" {...props} />,
   h3: (props) => <h3 className="h3" {...props} />,
   h4: (props) => <h4 className="h4" {...props} />,
   h5: (props) => <h5 className="h5" {...props} />,
   ul: (props) => <ul className="ul" {...props} />,
   ol: (props) => <ol className="ol" {...props} />,
   li: (props) => <li className="li" {...props} />,
   table: (props) => (
      <div className="mb-8" style={{ overflow: "auto" }}>
         <table className="table" {...props} />
      </div>
   ),
   tr: (props) => <tr className="tr" {...props} />,
   th: (props) => <th className="th" {...props} />,
   td: (props) => <td className="td" {...props} />,
   thead: (props) => <thead className="thead" {...props} />,
   tbody: (props) => <tbody className="tbody" {...props} />,
   pre: (props) => (
      <pre className="p-1 mb-8 overflow-hidden rounded-md card" {...props} />
   ),
   code: (props) => <code className="code" {...props} />,
   hr: (props) => <hr className="mb-8" {...props} />,
   blockquote: (props) => <blockquote className="blockquote" {...props} />,
}

export const RenderMDX = (props: MDXRemoteProps) => (
   <MDXRemote components={AppMDXComponents} {...props} />
)
