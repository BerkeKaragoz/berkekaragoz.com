import { COMMON_TNS } from "@/lib/i18n/consts"
import { Dialog } from "@headlessui/react"
import { XIcon } from "@heroicons/react/solid"
import { useTranslation } from "next-i18next"
import { ReactNode } from "react"

type PostNavSheetProps = {
   open: boolean
   title: string
   onClose: () => void
   children: ReactNode
}

/** Page navigation sheet, below the rail breakpoint */
export const PostNavSheet = ({
   open,
   title,
   onClose,
   children,
}: PostNavSheetProps) => {
   const { t } = useTranslation([COMMON_TNS])

   return (
      <Dialog open={open} onClose={onClose} className="post-nav-sheet relative z-30">
         <div
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
            aria-hidden="true"
         />
         <div className="fixed inset-x-0 bottom-0 flex justify-center">
            <Dialog.Panel className="w-full max-w-md p-4 overflow-y-auto break-words card rounded-b-none max-h-[75vh]">
               <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="font-medium uppercase-first">
                     {title}
                  </Dialog.Title>
                  <button
                     onClick={onClose}
                     aria-label={t("close")}
                     className="p-1 card-input"
                  >
                     <XIcon className="w-5 h-5" />
                  </button>
               </div>
               {children}
            </Dialog.Panel>
         </div>
      </Dialog>
   )
}

export default PostNavSheet
