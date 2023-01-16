import React from "react"

// mb later
const canvasWidth = 272
const canvasHeight = 96

type DrawableCanvasProps = React.HTMLAttributes<HTMLCanvasElement> & {
   strokeStyle?: CanvasFillStrokeStyles["strokeStyle"]
   clear?: number
}

const DrawableCanvas: React.FC<DrawableCanvasProps> = (props) => {
   const { strokeStyle = "black", clear = 0, ...rest } = props

   const [isDrawing, setIsDrawing] = React.useState(false)
   const ref = React.useRef<HTMLCanvasElement>(null)
   const contextRef = React.useRef<CanvasRenderingContext2D>(null)

   const drawStart = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
      if (!contextRef.current) return
      const { offsetX, offsetY } = nativeEvent

      contextRef.current.beginPath()
      contextRef.current.moveTo(offsetX, offsetY)
      setIsDrawing(true)
   }

   const drawEnd = () => {
      if (!contextRef.current) return

      contextRef.current.closePath()
      setIsDrawing(false)
   }

   const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
      if (!contextRef.current) return
      if (!isDrawing) return

      const { offsetX, offsetY } = nativeEvent

      contextRef.current.lineTo(offsetX, offsetY)
      contextRef.current.stroke()
   }

   React.useEffect(() => {
      const canvas = ref.current
      if (!canvas) return

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      const context = canvas.getContext("2d")
      if (!context) return
      context.lineCap = "round"
      context.lineWidth = 2

      // @ts-expect-error by default forwardedRef.current is readonly. Let's ignore it
      contextRef.current = context

      window.addEventListener("mouseup", drawEnd)
   }, [])

   React.useEffect(() => {
      const canvas = ref.current
      if (!canvas) return

      const context = canvas.getContext("2d")
      if (!context) return

      context.strokeStyle = strokeStyle
   }, [strokeStyle])

   React.useEffect(() => {
      const canvas = ref.current
      if (!canvas) return

      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height)
   }, [clear])

   return (
      <canvas
         {...rest}
         onMouseDown={drawStart}
         onMouseMove={draw}
         ref={ref}
         style={{
            cursor: "crosshair",
         }}
      />
   )
}

export default DrawableCanvas
