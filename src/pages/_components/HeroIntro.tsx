import IconButton from "@/components/atomic/IconButton/IconButton"
import LinkBox from "@/components/atomic/LinkBox/LinkBox"
import { PAGES_TNS } from "@/lib/i18n/consts"
import { ComponentPropsWithTranslation } from "@/lib/types/i18n"
import { Popover } from "@headlessui/react"
import { DotsVerticalIcon, ServerIcon } from "@heroicons/react/solid"
import React from "react"
import { Trans, withTranslation } from "react-i18next"

const HeroIntro: React.FC<ComponentPropsWithTranslation<Record<string, never>>> = (
   props
) => {
   const { t } = props

   return (
      <div className="flex flex-col items-start justify-center flex-grow-0 md:w-1/2">
         <h1 className="text-5xl font-semibold lg:text-6xl">
            <Trans t={t} i18nKey="hero.title" values={{ name: "Berke Karagöz" }}>
               {"Hi, I'm"}
               <br />
               <strong className="font-bold select-all lg:whitespace-nowrap text-primary-600 dark:text-primary-400">
                  Berke Karagöz
               </strong>
               {"."}
            </Trans>
         </h1>
         <p className="max-w-sm mt-2 font-semibold ms-1 text-background-700 dark:text-background-300">
            <Trans t={t} i18nKey="hero.subtitle">
               A curious frontend engineer who had been gaining various insights
               about web development.
            </Trans>
         </p>
         <div className="flex items-stretch gap-2 mt-2 ml-auto md:ml-0">
            <Popover className="relative">
               <Popover.Button
                  as={IconButton}
                  className="w-10 h-full p-2"
                  aria-label={t("translate")}
               >
                  <DotsVerticalIcon />
               </Popover.Button>

               <Popover.Panel className="absolute z-40 p-2 mt-2 card max-w-prose">
                  <LinkBox
                     href="https://box.berkekaragoz.com"
                     className="flex items-center gap-2 p-2 card-input border-primary-400 dark:border-primary-600 border-opacity-20 dark:border-opacity-20"
                  >
                     <h2 className="font-semibold">Box.berkekaragoz.com</h2>
                     <ServerIcon className="w-4 h-4" />
                  </LinkBox>
                  <p className="mt-1 text-sm ms-1 opacity-80">
                     <Trans t={t} i18nKey="hero.boxServerDesc">
                        My general purpose NGINX, Ubuntu 20.04 server. I use it as a
                        toolbox.
                     </Trans>
                  </p>
               </Popover.Panel>
            </Popover>
            <LinkBox
               href="/posts"
               className="inline-block px-3 py-2 font-semibold card-input"
            >
               <Trans t={t} i18nKey="hero.actionButton">
                  Go to my blog
               </Trans>{" "}
               &rarr;
            </LinkBox>
         </div>
      </div>
   )
}

export default withTranslation(PAGES_TNS)(HeroIntro)
