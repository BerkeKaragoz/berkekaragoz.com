import { PAGES_TNS } from "@/lib/i18n/consts"
import { ComponentPropsWithTranslation } from "@/lib/types/i18n"
import { getMonthsBetween } from "@/lib/utils"
import { Tab } from "@headlessui/react"
import clsx from "clsx"
import React from "react"
import { Trans, withTranslation } from "react-i18next"

const ExpTab: React.FC<Record<string, unknown>> = (props) => {
   const { children, ...rest } = props

   return (
      <Tab className={"card-input p-2 flex-grow"} {...rest}>
         {({ selected }) => (
            <h2
               className={clsx([
                  "inline-block border-b-4 sm:border-b-0 sm:border-r-4 p-1 sm:mr-2 rounded-sm font-semibold w-full",
                  {
                     "border-primary-400": selected,
                  },
                  {
                     "border-background-300 dark:border-primary-200 text-primary-800 dark:text-primary-200 text-opacity-60 dark:text-opacity-60":
                        !selected,
                  },
               ])}
            >
               {children}
            </h2>
         )}
      </Tab>
   )
}

const ExpPanel: React.FC<{
   role: string
   name: string
   nameUrl: React.AnchorHTMLAttributes<HTMLAnchorElement>["href"]
   dateStartTime?: React.TimeHTMLAttributes<HTMLElement>["dateTime"]
   startTime: string
   dateEndTime?: React.TimeHTMLAttributes<HTMLElement>["dateTime"]
   endTime: string
   jobType?: string
   location?: string
}> = (props) => {
   const {
      children,
      role,
      name,
      nameUrl,
      dateStartTime = "",
      startTime,
      dateEndTime = "",
      endTime,
      jobType,
      location,
      ...rest
   } = props

   return (
      <Tab.Panel {...rest}>
         <div className="mb-2">
            <div className="text-xl">
               <strong>{role}</strong>
               {" @ "}
               <a href={nameUrl}>
                  <strong>{name}</strong>
               </a>
            </div>
            <div className="text-subtitle-color">
               <time dateTime={dateStartTime}>{startTime}</time>
               {" - "}
               <time dateTime={dateEndTime}>{endTime}</time>
               {(jobType || location) && <br />}
               <em>{jobType}</em>
               {location && " • "}
               <address className="inline-block">{location}</address>
            </div>
         </div>
         <div>{children}</div>
      </Tab.Panel>
   )
}

const Experience: React.FC<
   ComponentPropsWithTranslation<Record<string, unknown>>
> = (props) => {
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   const { t, tReady: tready, ...rest } = props
   const currentDate = new Date()

   return (
      <div
         className="flex flex-col justify-center w-full mx-auto my-16 text-center "
         {...rest}
      >
         <h1 className="section-heading">
            <Trans t={t} i18nKey="index.experience.title">
               Experience
            </Trans>
         </h1>
         <Tab.Group as="div" className="justify-center block sm:flex sm:flex-row">
            <Tab.List className="flex flex-shrink-0 gap-4 p-2 mb-1 overflow-x-auto bg-black rounded-lg sm:mr-2 whitespace-nowrap sm:mb-0 sm:flex-col bg-opacity-5 dark:bg-opacity-20">
               <ExpTab>ESL Gaming</ExpTab>
               <ExpTab>HAVELSAN</ExpTab>
               <ExpTab>DATAMARKET</ExpTab>
               <span className="flex items-center justify-center font-semibold text-caption-color">
                  <Trans t={t} i18nKey="index.experience.volunteer">
                     Volunteer
                  </Trans>
               </span>
               <ExpTab>ESL Play</ExpTab>
               <ExpTab>Riot Games</ExpTab>
               <ExpTab>Ancha Space T.</ExpTab>
            </Tab.List>
            <Tab.Panels className="w-full p-2 text-left bg-black rounded-lg bg-opacity-5 dark:bg-opacity-20 max-w-prose">
               <div className="p-3 card">
                  <ExpPanel
                     role={t("index.experience.eslGamingRole")}
                     name="ESL Gaming"
                     nameUrl="https://www.eslgaming.com/"
                     dateStartTime="2021-07-03"
                     startTime={`${t("index.experience.jul")} 2021`}
                     dateEndTime=""
                     endTime={`${t("index.experience.present")}`}
                     jobType={t("index.experience.freelance")}
                     location="Katowice, PL (Hybrid)"
                  >
                     <Trans t={t} i18nKey="index.experience.eslGamingDesc">
                        {"Managing tournaments and players in projects such as:"}
                        <ul className="list-disc ms-6">
                           <li>ESL PUBG Masters / Open</li>
                           <li>Sony Open Series Apex Legends</li>
                           <li>
                              Sony Call of Duty: Cold War Battle for Beta / CHOWH1
                              Challenge
                           </li>
                           <li>Special Events</li>
                        </ul>
                     </Trans>
                  </ExpPanel>
                  <ExpPanel
                     role={t("index.experience.havelsanRole")}
                     name="HAVELSAN"
                     nameUrl="https://havelsan.com.tr/"
                     dateStartTime="2020-02-01"
                     startTime={`${t("index.experience.feb")} 2020`}
                     dateEndTime="2020-06-15"
                     endTime={`${t("index.experience.jun")} 2020 (~5 ${t(
                        "index.experience.mos"
                     )})`}
                     jobType={t("index.experience.fullTime")}
                     location="Ankara, TR"
                  >
                     <Trans t={t} i18nKey="index.experience.havelsanDesc">
                        <p>
                           Developed policies and tools for Liman MYS (a
                           configuration management and software provisioning tool)
                           and GNU/Linux systems focused on Debian using C and Shell
                           Scripting.
                        </p>
                        <p className="mt-2">
                           {"Developed "}
                           <a href="https://liman.havelsan.com.tr">
                              liman.havelsan.com.tr
                           </a>
                           {" with Hugo and Bulma frameworks to present Liman MYS."}
                        </p>
                     </Trans>
                  </ExpPanel>
                  <ExpPanel
                     role={t("index.experience.datamarketRole")}
                     name="DATAMARKET"
                     nameUrl="https://www.datamarket.com.tr/?lang=en"
                     dateStartTime="2021-06-01"
                     startTime={`${t("index.experience.jun")} 2019`}
                     dateEndTime="2021-09-15"
                     endTime={`${t("index.experience.sep")} 2019 (~4 ${t(
                        "index.experience.mos"
                     )})`}
                     jobType={t("index.experience.fullTime")}
                     location="Istanbul, TR"
                  >
                     <Trans t={t} i18nKey="index.experience.datamarketDesc">
                        Developed a dynamic training application (as PoC) for GearVR,
                        for our digital channel marketing and product management unit
                        with Unity using C#, ShaderLab, Android SDK and Oculus SDK.
                        Trainings can be created via the admin panel on desktop and
                        can be synchronized with all devices with support.
                        Transactions were made with PHP and MySQL.
                     </Trans>
                  </ExpPanel>
                  <ExpPanel
                     role={t("index.experience.eslPlayRole")}
                     name="ESL Play"
                     nameUrl="https://play.eslgaming.com/"
                     dateStartTime="2018-11-01"
                     startTime={`${t("index.experience.nov")} 2018`}
                     dateEndTime="2022-04-15"
                     endTime={`${t("index.experience.mar")} 2022 (~3 ${t(
                        "index.experience.yr"
                     )} 5 ${t("index.experience.mos")})`}
                  >
                     <Trans t={t} i18nKey="index.experience.eslPlayDesc">
                        Being/been a volunteer senior referee at Europe staff team
                        for Counter-Strike and Quake section.
                        <ul className="list-disc ms-6">
                           <li>
                              Took part in the organization of +10 leagues and +60
                              cups as an admin so far.
                           </li>
                           <li>
                              Play testing components or software integrations for
                              upcoming tournaments occasionally.
                           </li>
                           <li>
                              Providing player support, solving problems via tickets.
                           </li>
                        </ul>
                     </Trans>
                  </ExpPanel>
                  <ExpPanel
                     role={t("index.experience.riotRole")}
                     name="Riot Games"
                     nameUrl="https://www.riotgames.com/"
                     dateStartTime="2020-05-15"
                     startTime={`${t("index.experience.may")} 2020`}
                     dateEndTime="2021-05-15"
                     endTime={`${t("index.experience.jun")} 2021 (~1 ${t(
                        "index.experience.yr"
                     )} 2 ${t("index.experience.mos")})`}
                  >
                     <Trans t={t} i18nKey="index.experience.riotDesc">
                        Organized VALORANT events and managed the community of
                        Bilkent University.
                     </Trans>
                  </ExpPanel>
                  <ExpPanel
                     role={t("index.experience.anchaRole")}
                     name="Ancha Space Technologies"
                     nameUrl="https://www.linkedin.com/company/anchaspace/"
                     dateStartTime="2021-06-15"
                     startTime={`${t("index.experience.jun")} 2019`}
                     dateEndTime="2021-09-15"
                     endTime={`${t("index.experience.sep")} 2019 (~1 ${t(
                        "index.experience.yr"
                     )} 2 ${t("index.experience.mos")})`}
                  >
                     <Trans t={t} i18nKey="index.experience.anchaDesc">
                        <p>
                           Designed wheels and the connection between the wheels and
                           the motors to compete in European Rover Challenge. The
                           components were designed to endure extreme conditions of
                           Mars and space. The primary design program was Autodesk
                           Inventor.
                        </p>
                        <p className="mt-2">
                           Ancha Space Technologies is an interdisciplinary
                           organization that their headquarters are located on
                           Istanbul Başakşehir Living Lab. The team competes in space
                           technology related challenges.
                        </p>
                     </Trans>
                  </ExpPanel>
               </div>
            </Tab.Panels>
         </Tab.Group>
      </div>
   )
}

export default withTranslation(PAGES_TNS)(Experience)
