import React from "react"

// mb later
const canvasWidth = 272
const canvasHeight = 96

type DrawableCanvasProps = React.HTMLAttributes<HTMLCanvasElement> & {
   strokeStyle?: CanvasFillStrokeStyles["strokeStyle"]
   clear?: number
   initDrawSmile?: boolean
}

const drawSmile = (context: CanvasRenderingContext2D) => {
   context.beginPath()
   context.arc(canvasWidth - 40, canvasHeight - 50, 50, 0, Math.PI * 2, true) // Outer circle
   context.moveTo(canvasWidth - 70, canvasHeight - 45)
   context.arc(canvasWidth - 40, canvasHeight - 45, 30, 0, Math.PI, false) // Mouth (clockwise)
   context.moveTo(canvasWidth - 45, canvasHeight - 60)
   context.arc(canvasWidth - 40, canvasHeight - 60, 2, 0, Math.PI * 2, true) // Left eye
   context.arc(canvasWidth - 40, canvasHeight - 60, 4, 0, Math.PI * 2, true)
   context.arc(canvasWidth - 40, canvasHeight - 60, 5, 0, Math.PI * 2, true)
   context.moveTo(canvasWidth - 80, canvasHeight - 60)
   context.arc(canvasWidth - 75, canvasHeight - 60, 2, 0, Math.PI * 2, true) // Right eye
   context.arc(canvasWidth - 75, canvasHeight - 60, 4, 0, Math.PI * 2, true)
   context.arc(canvasWidth - 75, canvasHeight - 60, 5, 0, Math.PI * 2, true)
   context.stroke()
}

const DrawableCanvas: React.FC<DrawableCanvasProps> = (props) => {
   const { strokeStyle = "black", clear = 0, initDrawSmile = false, ...rest } = props

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

      const context = canvas.getContext("2d")
      if (!context) return

      context.strokeStyle = strokeStyle
   }, [strokeStyle])

   React.useEffect(() => {
      const canvas = ref.current
      if (!canvas) return

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      const context = canvas.getContext("2d")
      if (!context) return
      context.lineCap = "round"
      context.lineWidth = 2
      context.strokeStyle = strokeStyle

      // @ts-expect-error by default forwardedRef.current is readonly. Let's ignore it
      contextRef.current = context

      if (initDrawSmile) drawSmile(context)

      window.addEventListener("mouseup", drawEnd)

      // we only want this function to be run on mount
      // we ignore the rest because we only care about the initial values
      // and we don't want to create refs for them
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [])

   React.useEffect(() => {
      const canvas = ref.current
      if (!canvas) return

      if (clear === 0) return

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
