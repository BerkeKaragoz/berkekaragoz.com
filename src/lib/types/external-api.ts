export type CoinPriceData = { mins: number; price: string }
export type CoinPriceDataStorage = CoinPriceData & { timestamp: string | Date }
export type IAddConfettiConfig = {
   confettiRadius?: number
   confettiNumber?: number
   confettiColors?: string[]
   emojis?: string[]
   emojiSize?: number
}
