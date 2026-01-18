import { useEffect, useReducer } from "react"

export const generateRandomInt = (max = 99) => Math.floor(Math.random() * max)

export const useGenerateRandomInt = () => {
   const reducer = useReducer<number, [number]>(
      (_: number, max = 99) => generateRandomInt(max),
      99
   )

   useEffect(() => void reducer[1](99), [reducer[1]])

   return reducer
}
