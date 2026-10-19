import Main from "@/components/atomic/Main/Main"
import Section from "@/components/atomic/Section/Section"
import Footer from "@/components/organism/Footer/Footer"
import Header from "@/components/organism/Header/Header"
import React, { useEffect, useRef } from "react"
import Head from "next/head"
import { GetStaticProps, NextPage } from "next"
import { MDXRemoteSerializeResult } from "next-mdx-remote"
import { serializeWithAppOptions } from "@/lib/api/blog-client"
import { RenderMDX } from "@/lib/utils/MDX"
import { COMMON_TNS, PAGES_TNS } from "@/lib/i18n/consts"
import { DEFAULT_LOCALE } from "@/lib/utils/consts"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import "highlight.js/styles/atom-one-dark.css"

const ASSETS = "/assets/projects/graphitect"

// A short screen recording that plays like a GIF, and holds still for reduced motion.
const Clip: React.FC<{
   name: string
   width: number
   height: number
   label: string
}> = (props) => {
   const { name, width, height, label } = props
   const ref = useRef<HTMLVideoElement>(null)

   useEffect(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
         ref.current?.pause()
      }
   }, [])

   return (
      <video
         ref={ref}
         autoPlay
         loop
         muted
         playsInline
         aria-label={label}
         className="w-full h-auto rounded-md"
         height={height}
         poster={`${ASSETS}/${name}-poster.png`}
         preload="metadata"
         src={`${ASSETS}/${name}.mp4`}
         width={width}
      />
   )
}

const Figure: React.FC<{ caption: string; children: React.ReactNode }> = (props) => (
   <figure className="p-2 card">
      {props.children}
      <figcaption className="px-1 pt-2 text-sm opacity-80">
         {props.caption}
      </figcaption>
   </figure>
)

const Point: React.FC<{ title: string; children: React.ReactNode }> = (props) => (
   <div>
      <h2 className="font-semibold text-caption-color">{props.title}</h2>
      <div className="mt-1 space-y-2 text-subtitle-color">{props.children}</div>
   </div>
)

const FENCE = "```"

// Each sample is written like a post code block and goes through the blog's MDX pipeline.
const SAMPLES = [
   {
      title: "1. Mark a function",
      file: "src/lib.rs",
      lang: "rust",
      code: `// @node repeat(text: text, times: integer = 3) -> text
pub fn repeat(text: &str, times: i64) -> String {
    vec![text; times as usize].join(" ")
}`,
   },
   {
      title: "2. Wire the cards",
      file: "main.gph",
      lang: "python",
      code: `word = shout("hey")
line = repeat(word, times: 3)
say(line)`,
   },
   {
      title: "3. Save to get the Rust code",
      file: "main_gph.rs",
      lang: "rust",
      code: `fn main() {
    let word = toy::shout("hey");
    let line = toy::repeat(&word, 3);
    toy::say(&line);
}`,
   },
   {
      title: "Or Python code",
      file: "main_gph.py",
      lang: "python",
      code: `import toy

def main():
    word = toy.shout("hey")
    line = toy.repeat(word, 3)
    toy.say(line)`,
   },
]

type Sample = { title: string; file: string; source: MDXRemoteSerializeResult }

const GraphitectPage: NextPage<{ samples: Sample[] }> = ({ samples }) => (
   <div>
      <Head>
         <title>Graphitect | Berke Karagöz</title>
         <meta
            content="A node editor for code. Functions are cards, the graph is a text file, and saving writes plain source."
            name="description"
         />
         <link href="/favicon.ico" rel="icon" />
      </Head>
      <Header />
      <Main>
         <div className="h-24 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
         <Section className="flex-col py-8">
            <h1 className="text-5xl font-semibold text-center text-caption-color lg:text-left">
               Graphitect
            </h1>
            <hr className="mt-4 mb-6 divider" />
            <p className="text-lg max-w-prose">
               A node editor for code. Functions show up as cards, and wiring them
               together writes a program in the project&apos;s own language.
            </p>

            <div className="grid gap-6 mt-8 sm:grid-cols-2">
               <Point title="Nodes">
                  Graphitect is language agnostic: a function with an{" "}
                  <code className="code">@node</code> comment becomes a card,
                  whether it&apos;s Rust, Python, Go, TypeScript, C# or C++.
               </Point>
               <Point title="The graph file">
                  The graph is saved as <code className="code">main.gph</code>, a
                  short text file. Editing a card changes that file, and editing the
                  file updates the cards.
               </Point>
               <Point title="Running">
                  Run keeps the program loaded, so a changed value or wire runs
                  again without a rebuild. Each card shows whether it ran, and the
                  error if it failed.
               </Point>
               <Point title="Output">
                  <kbd className="code">Ctrl+S</kbd> writes plain source that builds
                  with the project&apos;s toolchain and doesn&apos;t depend on
                  Graphitect. Card values become command-line flags.
               </Point>
            </div>

            <div className="p-2 mt-10 space-y-2 card-backdrop">
               <Figure caption="Stable Diffusion 1.5 as five Rust functions on libtorch. Changing the prompt, then Run.">
                  <Clip
                     height={840}
                     label="Typing a new prompt on the Encode Text card and pressing Run; the picture in Output changes from a fox to a lighthouse"
                     name="run"
                     width={1500}
                  />
               </Figure>
               <Figure caption="In VS Code: saving main.gph updates the cards, and editing a card updates main.gph.">
                  <Clip
                     height={720}
                     label="Changing times from 3 to 5 in main.gph updates the Repeat card; changing la to hey on the Word card updates main.gph, and the run prints hey five times"
                     name="code"
                     width={1280}
                  />
               </Figure>
            </div>

            <h2 className="mt-10 mb-4 text-2xl font-semibold text-caption-color">
               How it works
            </h2>
            {samples.map((sample) => (
               <div key={sample.file}>
                  <p className="flex justify-between gap-4 mb-1 text-sm">
                     <span className="font-semibold text-caption-color">
                        {sample.title}
                     </span>
                     <span className="font-monospace text-subtitle-color">
                        {sample.file}
                     </span>
                  </p>
                  <RenderMDX {...sample.source} />
               </div>
            ))}

            <p className="text-sm text-subtitle-color">
               Rust, Tauri 2 and WebAssembly, drawn with Skia. Windows, pre-release.
            </p>
         </Section>
         <div className="h-24 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
      </Main>
      <Footer />
   </div>
)

export const getStaticProps: GetStaticProps = async ({
   locale = DEFAULT_LOCALE,
}) => ({
   props: {
      ...(await serverSideTranslations(locale, [PAGES_TNS, COMMON_TNS])),
      samples: await Promise.all(
         SAMPLES.map(async ({ title, file, lang, code }) => ({
            title,
            file,
            source: await serializeWithAppOptions(
               `${FENCE}${lang}\n${code}\n${FENCE}`
            ),
         }))
      ),
   },
})

export default GraphitectPage
