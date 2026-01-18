/** https://github.com/bmvantunes/youtube-react-testing-video9-nextjs-router/blob/main/src/test-utils/createMockRouter.ts */
import { DEFAULT_LOCALE } from "@/lib/utils/consts"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { NextRouter } from "next/router"

export const createMockRouter = (
   overrides?: Partial<AppRouterInstance>
): AppRouterInstance => ({
   back: jest.fn(),
   forward: jest.fn(),
   push: jest.fn(),
   replace: jest.fn(),
   refresh: jest.fn(),
   prefetch: jest.fn(),
   ...overrides,
})
