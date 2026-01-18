import { fireEvent, screen } from "@testing-library/dom"
import { render } from "@testing-library/react"
import IconButton from "./IconButton"

describe("Icon Button", () => {
   it("can click", () => {
      const fnMock = jest.fn()

      render(<IconButton onClick={fnMock}></IconButton>)

      const el = screen.getByRole("button")

      expect(el).toBeInTheDocument()

      expect(fnMock).toHaveBeenCalledTimes(0)

      fireEvent.click(el)

      expect(fnMock).toHaveBeenCalledTimes(1)
   })

   it("can be disabled", () => {
      const fnMock = jest.fn()

      render(<IconButton onClick={fnMock} disabled></IconButton>)

      const el = screen.getByRole("button")

      fireEvent.click(el)

      expect(fnMock).toHaveBeenCalledTimes(0)
   })
})
