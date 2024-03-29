import IconButton from "@/components/atomic/IconButton/IconButton"
import LinkBox from "@/components/atomic/LinkBox/LinkBox"
import Tooltip from "@/components/atomic/Tooltip/Tooltip"
import { COMMON_TNS } from "@/lib/i18n/consts"
import { Popover, RadioGroup } from "@headlessui/react"
import {
   MoonIcon,
   NewspaperIcon,
   SunIcon,
   TranslateIcon,
} from "@heroicons/react/solid"
import clsx from "clsx"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useRouter } from "next/router"
import React from "react"
import { useTranslation } from "react-i18next"

export const Header: React.FC = (props) => {
   // const { children } = props;
   const router = useRouter()
   const { theme = "dark", setTheme } = useTheme()
   const { t, i18n } = useTranslation([COMMON_TNS])
   const [isMounted, setIsMounted] = React.useState(false)

   const handleSelectLang = (locale: string) => {
      i18n.changeLanguage(locale)
      router.push(router.asPath, undefined, { locale })
   }

   const switchTheme = () => {
      if (isMounted) setTheme(theme === "light" ? "dark" : "light")
   }

   React.useEffect(() => {
      setIsMounted(true)
   }, [])

   return (
      <>
         <header className="fixed top-0 z-10 w-full px-4 border-b sm:px-8 border-primary-200 h-14 border-opacity-40 dark:border-primary-900 dark:border-opacity-20 bg-background-100 bg-linear-gradient-100 bg-opacity-70 dark:bg-background-900 dark:bg-opacity-80 backdrop-blur-lg shadow-sm">
            <div className="flex items-center h-full max-w-screen-xl gap-2 mx-auto my-0">
               <div className="p-0.5 h-10">
                  <LinkBox href="/">
                     <Image
                        src={
                           theme === "dark"
                              ? "/assets/EBerkeKaragoz-paraph-light.png"
                              : "/assets/EBerkeKaragoz-paraph-dark.png"
                        }
                        alt="Berke Karagöz"
                        height={36}
                        width={115}
                        className="object-contain"
                     />
                  </LinkBox>
               </div>

               <div
                  className="flex-grow" // spacer
               />

               <Tooltip capitalize text="Blog" className="block sm:hidden">
                  <LinkBox
                     href="/posts"
                     className="flex items-center flex-shrink-0 gap-2 p-1 sm:px-2 card-input"
                     aria-label="blog"
                  >
                     <span className="hidden sm:block">Blog</span>
                     <NewspaperIcon
                        style={{
                           height: "22px",
                           width: "22px",
                        }}
                     />
                  </LinkBox>
               </Tooltip>

               <Tooltip
                  capitalize
                  text={theme === "dark" ? t("light theme") : t("dark theme")}
               >
                  <IconButton
                     onClick={switchTheme}
                     aria-label={
                        theme === "dark" ? t("light theme") : t("dark theme")
                     }
                  >
                     {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                  </IconButton>
               </Tooltip>

               <Popover className="relative">
                  <Popover.Button as={IconButton} aria-label={t("translate")}>
                     <Tooltip capitalize text={t("translate")} className="mt-2.5">
                        <TranslateIcon />
                     </Tooltip>
                  </Popover.Button>

                  <Popover.Panel className="absolute right-0 z-40 mt-1">
                     <RadioGroup
                        value={i18n.language}
                        onChange={handleSelectLang}
                        className="shadow-lg card dark:bg-background-900 bg-opacity-80 dark:bg-opacity-80"
                     >
                        <RadioGroup.Label className="sr-only">
                           Language
                        </RadioGroup.Label>
                        {router.locales?.map((locale) => (
                           <RadioGroup.Option
                              key={`radio-locale-${locale}`}
                              value={locale}
                              className={({ checked, active }) =>
                                 clsx([
                                    "p-2 m-1 select-none uppercase border rounded-lg cursor-pointer bg-background-50 border-primary-100 hover:bg-primary-100 dark:bg-background-900 dark:hover:bg-primary-900 dark:border-primary-900",
                                    {
                                       "bg-background-200 font-medium text-primary-600 dark:bg-background-800 dark:text-primary-400":
                                          checked,
                                       "text-primary-900": active,
                                    },
                                 ])
                              }
                           >
                              {locale.slice(0, locale.indexOf("-"))}
                           </RadioGroup.Option>
                        ))}
                     </RadioGroup>
                  </Popover.Panel>
               </Popover>
            </div>
         </header>
         <div className="flex-shrink-0 h-14 dark:bg-background-900" />
      </>
   )
}

export default Header
