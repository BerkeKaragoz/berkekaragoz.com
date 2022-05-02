import React from "react"
import styles from "./slider.module.css"
import clsx from "clsx"

const getProgressPercentage = (input: HTMLInputElement): number => {
   const min = +input.min || 0
   const max = +input.max || 100
   const value = +input.value

   return ((value - min) / (max - min)) * 100
}

// TODO temp
function useShareForwardedRef<T>(forwardedRef: React.Ref<T>) {
   // final ref that will share value with forward ref. this is the one we will attach to components
   const innerRef = React.useRef<T>(null)

   React.useEffect(() => {
      // after every render - try to share current ref value with forwarded ref
      if (!forwardedRef) return

      if (typeof forwardedRef === "function") {
         forwardedRef(innerRef.current)
         return
      }
      // @ts-ignore
      // by default forwardedRef.current is readonly. Let's ignore it
      forwardedRef.current = innerRef.current
   })

   return innerRef
}
type SliderProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
   (props, forwardedRef) => {
      const {
         children,
         className,
         onChange,
         style,
         disabled = false,
         min,
         max,
         ...rest
      } = props
      const _inputRef = useShareForwardedRef<HTMLInputElement>(forwardedRef)
      const _divRef = React.useRef<HTMLDivElement>(null)

      const updateVisualization = () => {
         if (_divRef.current && _inputRef.current)
            _divRef.current.style.setProperty(
               "--slider-progress",
               `${getProgressPercentage(_inputRef.current)}%`
            )
      }

      const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
         if (onChange) onChange(e)
         updateVisualization()
      }

      React.useEffect(() => {
         updateVisualization()
      }, [_inputRef, _inputRef.current?.value])

      /** Tailwind works better inline */
      return (
         <div
            className={clsx([styles.root, "inline-block", className])}
            style={style}
         >
            <div
               className={clsx([
                  styles.sliderContainer,
                  "relative h-3 px-2 overflow-visible group",
               ])}
               ref={_divRef}
            >
               <div
                  className={clsx([
                     styles.track,
                     "w-full rounded-full overflow-hidden bg-background-300 dark:bg-background-700",
                  ])}
               >
                  <div
                     className={clsx([
                        styles.progress,
                        "rounded-full bg-background-500 dark:bg-primary-200",
                        {
                           "group-hover:bg-primary-400 dark:group-hover:bg-primary-400":
                              !disabled,
                        },
                        { "opacity-50": disabled },
                     ])}
                  />
               </div>
               <div
                  className={clsx(
                     [styles.thumb],
                     "w-0 h-0 bg-transparent rounded-full",
                     {
                        "group-hover:opacity-50": disabled,
                     },
                     { "group-hover:opacity-100": !disabled }
                  )}
               />
               <input
                  {...rest}
                  disabled={disabled}
                  className={styles.input}
                  onChange={onChangeHandler}
                  type="range"
                  min={min}
                  max={max}
                  ref={_inputRef}
               />
            </div>
         </div>
      )
   }
)

Slider.displayName = "App-Slider"

export default Slider
