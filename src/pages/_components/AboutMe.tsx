import React from "react"
import Image from "next/image"
import { HeartIcon } from "@heroicons/react/solid"
import { ComponentPropsWithTranslation } from "@/lib/types/i18n"
import { Trans, withTranslation } from "react-i18next"
import { PAGES_TNS } from "@/lib/i18n/consts"

const assetNames = ["berke-with-camera.jpg", "berke-with-turkish-coffee.jpg"]
const assetBlurs = [
   "data:image/jpeg;base64,/9j/4AAinitialOneIsNotNeededlwT//Z",
   "data:image/webp;base64,UklGRhoEAABXRUJQVlA4WAoAAAAgAAAAqQAAqQAASUNDUBgCAAAAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANlZQOCDcAQAAcBIAnQEqqgCqAD7tcrBTqbivIqMxW4MQHYlnbuA9+Tkp8cGtPPY2u9P0vOnYAOZ0DpbromAG1pgp30f0D8cKVqaNPfot/ukpskwN2WUN2jZ4DMiBnEAFJDMgR1NJyezuuze3AC/WuWp5MlbbKcZ89KBDtX62OAe135DZbs7Ss+i51JOp4WTVOIAjz5hpD1DBiN+2Q4BILjkbTVYAAP7jSBnYKiissHYSUZjS0fudSMUNU3Z72iliLcXyqERpNJXFhOQ8Gbyl8DhE4Ec7Rj5Nx/ViUw54szb11DAykgWMnO0gNjnYulVA/jfBMYjQ4NhWjREnPaYtQ7uiDHZ4I36Fmuel4Ro5qVyG2/BFpuEcHW5et8uCzMQSg1kay30Efea8stlS9Y4/CsJ1U9Wiz8y2TtoW7e/6LOWLC8Hksl7CR4aqcMEfTufWX5K0Foe156UghwzAEzwUFVCROxZ2OJS69pO4IqnYp2vjz15hAARmbYMkaqjLkH3dOJ2RD6O88wM8S79oJdzRfkKVGeY1JLIm+L+2JhETa9/aEOaGc7FGzwL5g7qNCj6ZIu3kqa133pQ0jmpm8kUvEF2mkaIC60USFHJEXDKN3dy0DQdWVX0liLI7q6QnZL2MOp3gAAA=",
]

const AboutMe: React.FC<ComponentPropsWithTranslation<Record<string, never>>> = (
   props
) => {
   const { t } = props
   const [assetIndex, setAssetIndex] = React.useState(0)

   return (
      <div className="mx-auto my-24">
         <h2 className="section-heading">
            <Trans t={t} i18nKey="index.aboutMe.title">
               About Me
            </Trans>
         </h2>
         <div className="flex flex-col items-center lg:flex-row-reverse">
            <button
               className="flex-grow-0 flex-shrink-0 p-2 rounded-full image-wrapper card-input dark:bg-background-900"
               onClick={() => setAssetIndex((s) => (s + 1) % assetNames.length)}
            >
               <Image
                  src={`/assets/${assetNames[assetIndex]}`}
                  width={168}
                  height={168}
                  alt={`E. Berke Karagöz ${assetNames[assetIndex]}`}
                  className="object-cover rounded-full"
                  placeholder={assetIndex > 0 ? "blur" : "empty"}
                  blurDataURL={assetBlurs[assetIndex]}
               />
            </button>
            <article className="p-4 mt-8 lg:mt-0 lg:mr-8 max-w-prose card dark:bg-background-900">
               <Trans t={t} i18nKey="index.aboutMe.article">
                  <p className="indent-xs">
                     {
                        "Hi, my name is Berke. I was born in Istanbul. My interest in computer technology has been there since I was a kid. That led me to discover designing opportunities. Starting from gaming forums to designing graphics for various reasons. I have started to learn about software development just before I matriculated to Bilkent University "
                     }
                     <HeartIcon className="inline-block h-5 text-red-600 align-text-top" />
                     .
                  </p>
                  <p className="mt-2 indent-xs">
                     Since then, I have been learning about multiple fields of
                     software development. Focusing on front-end development abled me
                     to utilize my graphic design skills with programming.
                  </p>
                  <p className="mt-2 indent-xs">
                     As for the hobbies, competitive gaming is one of my biggest
                     ones. I play the chess of FPS, Quake, actively. In addition to
                     this, I had been playing Counter-Strike and more others. After,
                     I have been working as a tournament manager.
                  </p>
               </Trans>
            </article>
         </div>
      </div>
   )
}

export default withTranslation(PAGES_TNS)(AboutMe)
