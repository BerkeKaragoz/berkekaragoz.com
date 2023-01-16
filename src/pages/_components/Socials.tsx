import LinkBox from "@/components/atomic/LinkBox/LinkBox"
import LinkedInIcon from "@/lib/icons/LinkedIn"
import GithubIcon from "@/lib/icons/Github"
import React from "react"

const Socials: React.FC = (props) => {
   const { ...rest } = props

   return (
      <div
         className="flex flex-wrap items-center justify-center w-full max-w-sm gap-4 p-6 mx-auto my-24 bg-opacity-50 xl:p-8 sm:max-w-xl sm:justify-between card dark:bg-background-900 bg-primary-100"
         {...rest}
      >
         <LinkBox
            href="https://www.linkedin.com/in/BerkeKaragoz"
            className="flex-shrink-0 w-10 sm:w-12"
            aria-label="LinkedIn"
         >
            <LinkedInIcon />
         </LinkBox>
         <LinkBox
            href="https://github.com/BerkeKaragoz"
            className="flex-shrink-0 w-10 p-0 sm:w-12 "
            aria-label="GitHub"
         >
            <GithubIcon />
         </LinkBox>
         <strong className="text-xl font-medium text-primary-900 dark:text-primary-200 md:text-2xl xl:text-3xl">
            /BerkeKaragoz
         </strong>
      </div>
   )
}

export default Socials
