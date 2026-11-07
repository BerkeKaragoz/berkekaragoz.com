// Runs in <head> before anything else, from _document. Every Consent Mode
// signal starts denied, and Google's message waits for our go-ahead so each
// page can choose when it appears (controlledMessagingFunction).

export const CONSENT_HEAD_SCRIPT = [
   "window.dataLayer=window.dataLayer||[];",
   "window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};",
   "window.gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});",
   "window.googlefc=window.googlefc||{};",
   "window.googlefc.callbackQueue=window.googlefc.callbackQueue||[];",
   "window.googlefc.controlledMessagingFunction=function(m){window.__consentMessage=m;if(window.__consentReleased)m.proceed(true)};",
].join("")

/** Google's consent message tag for an AdSense client id ("ca-pub-…"). */
export const googleMessageSrc = (adsenseClient: string) =>
   `https://fundingchoicesmessages.google.com/i/${adsenseClient.replace(/^ca-/, "")}?ers=1`

// Google's snippet that ships with the message tag: a hidden frame that tells
// its scripts the tag is present.
export const GOOGLE_FC_PRESENT_SCRIPT =
   "(function(){function s(){if(!window.frames['googlefcPresent']){if(document.body){var f=document.createElement('iframe');f.style='width:0;height:0;border:none;z-index:-1000;left:-1000px;top:-1000px;';f.style.display='none';f.name='googlefcPresent';document.body.appendChild(f)}else{setTimeout(s,0)}}}s()})();"
