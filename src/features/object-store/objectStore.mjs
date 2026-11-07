// A private S3-compatible bucket (Cloudflare R2, AWS S3, B2...). Plain ESM so
// the Next.js routes and the node scripts in /scripts share one client.
import { AwsClient } from "aws4fetch"

/**
 * @typedef {{ endpoint: string, bucket: string, accessKeyId: string, secretAccessKey: string, region: string }} StoreConfig
 * @typedef {{ size: number, contentType: string | null }} ObjectInfo
 */

/**
 * Reads the store settings from the environment, or null when any is missing.
 * @param {Record<string, string | undefined>} [env]
 * @returns {StoreConfig | null}
 */
export function storeConfigFromEnv(env = process.env) {
   const endpoint = env.OBJECT_STORE_ENDPOINT
   const bucket = env.OBJECT_STORE_BUCKET
   const accessKeyId = env.OBJECT_STORE_ACCESS_KEY_ID
   const secretAccessKey = env.OBJECT_STORE_SECRET_ACCESS_KEY
   if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null
   return {
      endpoint: endpoint.replace(/\/+$/, ""),
      bucket,
      accessKeyId,
      secretAccessKey,
      // R2 signs with "auto"; AWS needs the bucket's real region.
      region: env.OBJECT_STORE_REGION || "auto",
   }
}

/** @param {string} key */
function encodeKey(key) {
   return key.split("/").map(encodeURIComponent).join("/")
}

/** @param {string} xml @param {string} tag */
function xmlValues(xml, tag) {
   const values = []
   const pattern = new RegExp(`<${tag}>([^<]*)</${tag}>`, "g")
   for (const match of xml.matchAll(pattern)) {
      values.push(
         match[1]
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&amp;/g, "&")
      )
   }
   return values
}

/** @param {StoreConfig} config */
export function createObjectStore(config) {
   const client = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      service: "s3",
      region: config.region,
   })
   const base = `${config.endpoint}/${encodeURIComponent(config.bucket)}`
   /** @param {string} key */
   const objectUrl = (key) => `${base}/${encodeKey(key)}`

   /** @param {Response} res @param {string} what */
   async function fail(res, what) {
      const body = await res.text().catch(() => "")
      throw new Error(`${what} failed: ${res.status} ${body.slice(0, 300)}`)
   }

   return {
      /**
       * @param {string} key
       * @returns {Promise<ObjectInfo | null>}
       */
      async head(key) {
         const res = await client.fetch(objectUrl(key), { method: "HEAD" })
         if (res.status === 404) return null
         if (!res.ok) await fail(res, `HEAD ${key}`)
         return {
            size: Number(res.headers.get("content-length") ?? 0),
            contentType: res.headers.get("content-type"),
         }
      },

      /**
       * @param {string} key
       * @returns {Promise<Response | null>}
       */
      async get(key) {
         const res = await client.fetch(objectUrl(key))
         if (res.status === 404) return null
         if (!res.ok) await fail(res, `GET ${key}`)
         return res
      },

      /**
       * @param {string} key
       * @param {BodyInit} body
       * @param {string} contentType
       */
      async put(key, body, contentType) {
         const res = await client.fetch(objectUrl(key), {
            method: "PUT",
            body,
            headers: { "Content-Type": contentType },
         })
         if (!res.ok) await fail(res, `PUT ${key}`)
      },

      /** @param {string} key */
      async delete(key) {
         const res = await client.fetch(objectUrl(key), { method: "DELETE" })
         if (!res.ok && res.status !== 404) await fail(res, `DELETE ${key}`)
      },

      /**
       * Every key under a prefix, following pagination.
       * @param {string} prefix
       * @returns {Promise<string[]>}
       */
      async list(prefix) {
         /** @type {string[]} */
         const keys = []
         /** @type {string | undefined} */
         let token
         do {
            const url = new URL(base)
            url.searchParams.set("list-type", "2")
            url.searchParams.set("prefix", prefix)
            if (token) url.searchParams.set("continuation-token", token)
            const res = await client.fetch(url.toString())
            if (!res.ok) await fail(res, `LIST ${prefix}`)
            const xml = await res.text()
            keys.push(...xmlValues(xml, "Key"))
            token =
               xmlValues(xml, "IsTruncated")[0] === "true"
                  ? xmlValues(xml, "NextContinuationToken")[0]
                  : undefined
         } while (token)
         return keys
      },

      /**
       * A short-lived URL that needs no credentials, for large downloads.
       * @param {string} key
       * @param {number} expiresInSeconds
       */
      async presignGet(key, expiresInSeconds) {
         const url = new URL(objectUrl(key))
         url.searchParams.set("X-Amz-Expires", String(expiresInSeconds))
         const signed = await client.sign(url.toString(), {
            aws: { signQuery: true },
         })
         return signed.url
      },
   }
}

/** @typedef {ReturnType<typeof createObjectStore>} ObjectStore */

/** @returns {ObjectStore | null} */
export function getObjectStore() {
   const config = storeConfigFromEnv()
   return config ? createObjectStore(config) : null
}
