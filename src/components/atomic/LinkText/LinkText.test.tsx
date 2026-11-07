import { fireEvent, render, screen } from "@testing-library/react"
import LinkText from "./LinkText"
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime"
import { createMockRouter } from "@/__mocks__/createRouter.mock"

describe("LinkText", () => {
   const msg = "Testing message."
   const href = "/testing"
   const mockRouter = createMockRouter()

   it("renders the contents", () => {
      render(<LinkText href={href}>{msg}</LinkText>)

      const el = screen.getByRole("link")

      expect(el).toHaveTextContent(msg)
      expect(el).toHaveAttribute("href", href)
   })

   it("link routes correctly", () => {
      render(
         <RouterContext.Provider value={mockRouter}>
            <LinkText href={href}>{msg}</LinkText>
         </RouterContext.Provider>
      )

      const el = screen.getByRole("link")

      fireEvent.click(el)

      expect(mockRouter.push).toHaveBeenCalledTimes(1)
      expect(mockRouter.push).toHaveBeenCalledWith(href, href, expect.anything())
   })
})
