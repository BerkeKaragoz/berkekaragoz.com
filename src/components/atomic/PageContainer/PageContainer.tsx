import React from "react"

type PageContainerProps = Record<string, unknown>

export const PageContainer: React.FC<PageContainerProps> = (props) => {
   const { children } = props

   return (
      <div className="box-border flex flex-col flex-grow h-full min-h-screen p-0 m-0 overflow-x-hidden">
         {children}
      </div>
   )
}

export default PageContainer
