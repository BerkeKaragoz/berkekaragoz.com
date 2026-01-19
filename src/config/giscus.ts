export interface GiscusConfig {
   repo: `${string}/${string}`
   repoId: string
   category: string
   categoryId: string
   mapping: "url" | "title" | "og:title" | "specific" | "number" | "pathname"
   strict: "0" | "1"
   reactionsEnabled: "0" | "1"
   emitMetadata: "0" | "1"
   inputPosition: "top" | "bottom"
   theme: string
   lang: string
   loading: "lazy" | "eager"
}

export const giscusConfig: GiscusConfig = {
   repo: (process.env["NEXT_PUBLIC_GISCUS_REPO"] ?? "") as `${string}/${string}`,
   repoId: process.env["NEXT_PUBLIC_GISCUS_REPO_ID"] ?? "",
   category: process.env["NEXT_PUBLIC_GISCUS_CATEGORY"] ?? "",
   categoryId: process.env["NEXT_PUBLIC_GISCUS_CATEGORY_ID"] ?? "",
   mapping: (process.env["NEXT_PUBLIC_GISCUS_MAPPING"] ??
      "pathname") as GiscusConfig["mapping"],
   strict: (process.env["NEXT_PUBLIC_GISCUS_STRICT"] ?? "0") as "0" | "1",
   reactionsEnabled: (process.env["NEXT_PUBLIC_GISCUS_REACTIONS_ENABLED"] ?? "1") as
      | "0"
      | "1",
   emitMetadata: (process.env["NEXT_PUBLIC_GISCUS_EMIT_METADATA"] ?? "1") as
      | "0"
      | "1",
   inputPosition: (process.env["NEXT_PUBLIC_GISCUS_INPUT_POSITION"] ?? "top") as
      | "top"
      | "bottom",
   theme: process.env["NEXT_PUBLIC_GISCUS_THEME"] ?? "transparent_dark",
   lang: process.env["NEXT_PUBLIC_GISCUS_LANG"] ?? "en",
   loading: "lazy",
}

export const validateGiscusConfig = (): boolean => {
   const isDev = process.env.NODE_ENV === "development"
   const missingFields: string[] = []

   if (!giscusConfig.repoId) missingFields.push("NEXT_PUBLIC_GISCUS_REPO_ID")
   if (!giscusConfig.categoryId) missingFields.push("NEXT_PUBLIC_GISCUS_CATEGORY_ID")
   if (!giscusConfig.repo) missingFields.push("NEXT_PUBLIC_GISCUS_REPO")

   if (missingFields.length > 0 && isDev) {
      console.warn(
         `[Giscus] Missing required environment variables: ${missingFields.join(", ")}`
      )
      return false
   }

   return missingFields.length === 0
}
