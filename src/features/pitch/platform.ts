export type Platform = "android" | "ios" | "mac" | "windows" | "other"

interface UserAgentPlatformLike {
   platform?: string
}

/** The visitor's OS, for messages that name system settings. Client-side only. */
export const detectPlatform = (): Platform => {
   if (typeof navigator === "undefined") return "other"
   const ua = navigator.userAgent ?? ""
   const uaPlatform = (
      navigator as Navigator & { userAgentData?: UserAgentPlatformLike }
   ).userAgentData?.platform

   // First: Android user agents also say Linux.
   if (uaPlatform === "Android" || /Android/.test(ua)) return "android"
   if (
      /iPhone|iPad|iPod/.test(ua) ||
      // iPadOS asks for desktop sites and says Macintosh.
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
   ) {
      return "ios"
   }
   if (uaPlatform === "macOS" || /Macintosh|Mac OS X/.test(ua)) return "mac"
   if (uaPlatform === "Windows" || /Windows/.test(ua)) return "windows"
   return "other"
}
