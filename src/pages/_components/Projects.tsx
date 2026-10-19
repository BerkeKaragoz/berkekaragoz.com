import LinkBox from "@/components/atomic/LinkBox/LinkBox"
import { PAGES_TNS } from "@/lib/i18n/consts"
import { ComponentPropsWithTranslation } from "@/lib/types/i18n"
import { placeholderBlurBase64, PLATFORM_GITHUB_LINK } from "@/lib/utils/consts"
import Image, { ImageProps } from "next/image"
import React from "react"
import { Trans, withTranslation } from "next-i18next"

const ProjectCard: React.FC<{
   src: string
   href?: string
   title: string
   subtitle: string
   ratio?: number
   blurDataURL?: ImageProps["blurDataURL"]
}> = (props) => {
   const {
      src,
      href = src,
      blurDataURL = placeholderBlurBase64,
      title,
      subtitle,
      ratio = 1,
      ...rest
   } = props

   return (
      <LinkBox href={href} className="p-1 rounded-lg hover:ring-2" {...rest}>
         <div className="p-2 card-input image-wrapper">
            <div className="h-40 overflow-hidden rounded-md md:h-full">
               <Image
                  src={src}
                  width={90 * ratio}
                  height={160 * ratio}
                  alt={title}
                  className="object-cover rounded-md"
                  placeholder="blur"
                  blurDataURL={blurDataURL}
               />
            </div>
         </div>
         <div className="w-0 min-w-full text-sm">
            <p className="font-semibold text-caption-color">{title}</p>
            <p className="opacity-80">{subtitle}</p>
         </div>
      </LinkBox>
   )
}

const Projects: React.FC<ComponentPropsWithTranslation<Record<string, never>>> = (
   props
) => {
   const { t } = props

   return (
      <div className="w-full py-12 text-center">
         <h2 className="text-3xl font-semibold text-caption-color">
            <Trans t={t} i18nKey="index.projects.title">
               Projects
            </Trans>
         </h2>
         <div className="flex flex-wrap items-start justify-center gap-3 my-8">
            <ProjectCard
               src="/assets/resource-usage-tracker.png"
               href="https://github.com/BerkeKaragoz/Resource-Usage-Tracker"
               title="Resource Usage Tracker"
               subtitle={t("index.projects.resourceUsageTrackerSubtitle")}
               blurDataURL="data:image/webp;base64,UklGRiwDAABXRUJQVlA4WAoAAAAgAAAAxwAATAEASUNDUBgCAAAAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANlZQOCDuAAAAMBUAnQEqyABNAT7tdrhWqaclI6AoATAdiWlu4XVRDQAJ7DNo+hf7aVAwDe+iXJzlaLoo9x2PlIrddCtQRoCVcnDV2xTlTdVZMXMfKRW66FagjQRMrOGrtinH4Bx9EuY+VJ5+shvHDMZ49J3yIiKVixc/eUEOaAe8TV8CNASoehBJzlPPfYNzhCaA6En7kNsWD3GslYG51zNMfyI0C3mZWi6HVr001U8PQgk5ynnvsG5nAAD+/uTEYqQuMcm66/0YTM8G2P3SuiQ3RwXE8giFF+BAONtQIHhAEdDpAgJCHSBHsCFtIwCD0F1CCzhAAA=="
            />
            <ProjectCard
               src="/assets/intergallery.jpg"
               href="https://github.com/BerkeKaragoz/Intergallery"
               title="Intergallery"
               blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMABgQFBgUEBgYFBgcHBggKEAoKCQkKFA4PDBAXFBgYFxQWFhodJR8aGyMcFhYgLCAjJicpKikZHy0wLSgwJSgpKP/bAEMBBwcHCggKEwoKEygaFhooKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/AABEIAAgABAMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABv/EAB0QAAEEAgMAAAAAAAAAAAAAAAIAAQMEESExMoH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBf/EABoRAQACAwEAAAAAAAAAAAAAAAEAAwIEESH/2gAMAwEAAhEDEQA/AJqKtBbjGa7QIbBdxgCMgbesO554x6iIibXF4SiaVb69n//Z"
               subtitle={t("index.projects.intergallerySubtitle")}
            />
            <ProjectCard
               src="/assets/graphitect-cards.png"
               href="/projects/graphitect"
               title="Graphitect"
               subtitle={t("index.projects.graphitectSubtitle")}
               ratio={1.5}
               blurDataURL="data:image/jpeg;base64,/9j//gAPTGF2YzYxLjMuMTAwAP/bAEMACAoKCwoLDQ0NDQ0NEA8QEBAQEBAQEBAQEBISEhUVFRISEhAQEhIUFBUVFxcXFRUVFRcXGRkZHh4cHCMjJCsrM//EAGIAAQEBAAAAAAAAAAAAAAAAAAMBBwEBAQEBAAAAAAAAAAAAAAAAAQIAAxAAAQQABwEBAAAAAAAAAAAAAQAhEQJSIgMEYpGBE6ERAAMAAwEAAAAAAAAAAAAAAAABETECElH/wAARCAAQAAkDARIAAhIAAxIA/9oADAMBAAIRAxEAPwDJI3FakizES0uOkddUCoBBMN4usYUVu1Y2rkkL63xKZOX4t0/QKA//2Q=="
            />
            <ProjectCard
               src="/assets/lobium.jpg"
               href="/projects/lobium"
               title="Lobium"
               subtitle={t("index.projects.lobiumSubtitle")}
               ratio={1.5}
               blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMABgQFBgUEBgYFBgcHBggKEAoKCQkKFA4PDBAXFBgYFxQWFhodJR8aGyMcFhYgLCAjJicpKikZHy0wLSgwJSgpKP/bAEMBBwcHCggKEwoKEygaFhooKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/AABEIAAgABQMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAAB//EABsQAAICAwEAAAAAAAAAAAAAAAABAiEDERIx/8QAFAEBAAAAAAAAAAAAAAAAAAAAA//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AIu+pO8kHql6ABRP/9k="
            />
            <ProjectCard
               src="/assets/yaver-voice.webp"
               href="https://play.google.com/store/apps/details?id=com.incomplexsolutions.yaver"
               title="Yaver"
               subtitle={t("index.projects.yaverSubtitle")}
               blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAAJAAUDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDlZ7zzHJF4SuTjkcUVzZ60Vq6sm73IVOKP/9k="
            />
            <ProjectCard
               src="/assets/stopwatch.png"
               href="https://github.com/BerkeKaragoz/Kognitif"
               title="Kognitif"
               subtitle={t("index.projects.kognitifSubtitle")}
               blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMABgQFBgUEBgYFBgcHBggKEAoKCQkKFA4PDBAXFBgYFxQWFhodJR8aGyMcFhYgLCAjJicpKikZHy0wLSgwJSgpKP/bAEMBBwcHCggKEwoKEygaFhooKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/AABEIAAgABQMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABv/EAB4QAAEDBQEBAAAAAAAAAAAAABEBAgQAAwUSIQYi/8QAFQEBAQAAAAAAAAAAAAAAAAAAAgX/xAAYEQACAwAAAAAAAAAAAAAAAAAAAQIRIf/aAAwDAQACEQMRAD8Ah8n4HM2ocDWZYY7RdntbKNxeKXFgP0OBAicJVVKVTcdHR//Z"
            />
         </div>
         <p>
            <a href={`${PLATFORM_GITHUB_LINK}?tab=repositories&q=&type=source`}>
               <Trans t={t} i18nKey="index.projects.seeMore">
                  And more repositories...
               </Trans>
            </a>
         </p>
      </div>
   )
}

export default withTranslation(PAGES_TNS)(Projects)
