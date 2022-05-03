import { WithTranslation } from "next-i18next"
import { PartialBy } from "./common"

export type ComponentPropsWithTranslation<T = Record<string, never>> = T &
   PartialBy<WithTranslation, "i18n" | "tReady">

export type ComponentPropsWithActiveTranslation<T = Record<string, never>> = T &
   PartialBy<WithTranslation, "tReady">
