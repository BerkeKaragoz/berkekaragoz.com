import { cn } from "@shortkit/cn"
import hljs from "highlight.js/lib/core"
import typescript from "highlight.js/lib/languages/typescript"
import xml from "highlight.js/lib/languages/xml"
import React from "react"

hljs.registerLanguage("typescript", typescript)
hljs.registerLanguage("xml", xml)

type CodeProps = {
   children: string
   className?: string
   // 1-based lines to mark, counted after the code is trimmed.
   highlight?: number[]
}

// Same theme as a post's code blocks, sized down for the demo and set in a
// well, so the code's own backdrop is cleared. Marked lines assume no token
// spans a line break, which holds for the snippets here.
const codeClass = "hljs language-ts !text-xs leading-relaxed !bg-none !bg-transparent"

export const Code: React.FC<CodeProps> = (props) => {
   const html = React.useMemo(
      () => hljs.highlight(props.children.trim(), { language: "typescript" }).value,
      [props.children]
   )
   const lines = React.useMemo(() => html.split("\n"), [html])

   return (
      <pre className={cn("overflow-auto well-code", props.className)}>
         {props.highlight ? (
            // The lines take over the theme's side padding, and sit in a box as
            // wide as the longest one, so a mark spans the whole scroll width.
            <code className={cn(codeClass, "!px-0")}>
               <span className="block w-max min-w-full">
                  {lines.map((line, i) => (
                     <span
                        key={i}
                        className={cn(
                           "block pl-[calc(1em-2px)] pr-[1em] border-l-2 transition-colors duration-300",
                           props.highlight!.includes(i + 1)
                              ? "bg-primary-400/15 border-primary-400"
                              : "border-transparent"
                        )}
                        dangerouslySetInnerHTML={{ __html: line || " " }}
                     />
                  ))}
               </span>
            </code>
         ) : (
            <code
               className={codeClass}
               dangerouslySetInnerHTML={{ __html: html }}
            />
         )}
      </pre>
   )
}
