/**
 * A pages-router mock to pass through RouterContext. The site uses the pages
 * router, and next/link there reads only RouterContext, not AppRouterContext.
 * Based on https://github.com/bmvantunes/youtube-react-testing-video9-nextjs-router/blob/main/src/test-utils/createMockRouter.ts
 */
import { DEFAULT_LOCALE } from "@/lib/utils/consts"
import type { NextRouter } from "next/router"

export const createMockRouter = (overrides?: Partial<NextRouter>): NextRouter => ({
   route: "/",
   pathname: "/",
   query: {},
   asPath: "/",
   basePath: "",
   locale: DEFAULT_LOCALE,
   locales: [DEFAULT_LOCALE],
   defaultLocale: DEFAULT_LOCALE,
   isLocaleDomain: false,
   isFallback: false,
   isReady: true,
   isPreview: false,
   push: jest.fn(() => Promise.resolve(true)),
   replace: jest.fn(() => Promise.resolve(true)),
   reload: jest.fn(),
   back: jest.fn(),
   forward: jest.fn(),
   prefetch: jest.fn(() => Promise.resolve()),
   beforePopState: jest.fn(),
   events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
   ...overrides,
})
