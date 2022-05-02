export const truncate = (str: string, n: number) =>
   str.length > n ? str.substr(0, n - 1).trim() + "\u2026" : str

export const generateRandomInt = (max = 100) => Math.ceil(Math.random() * max)

export const getMonthsBetween = (
   date1: Date,
   date2: Date,
   roundUpFractionalMonths = true
) => {
   let startDate = date1
   let endDate = date2
   let inverse = false
   if (date1 > date2) {
      startDate = date2
      endDate = date1
      inverse = true
   }

   const yearsDifference = endDate.getFullYear() - startDate.getFullYear()
   const monthsDifference = endDate.getMonth() - startDate.getMonth()
   const daysDifference = endDate.getDate() - startDate.getDate()

   let monthCorrection = 0
   if (roundUpFractionalMonths && daysDifference > 0) monthCorrection = 1
   else if (!roundUpFractionalMonths && daysDifference < 0) monthCorrection = -1

   return (
      (inverse ? -1 : 1) *
      (yearsDifference * 12 + monthsDifference + monthCorrection)
   )
}

export const getWordCount = (text: string) => text.trim().split(/\s+/).length

export const estimateReadingMinutes = (wordCount: number, wpm = 225) =>
   Math.ceil(wordCount / wpm)
