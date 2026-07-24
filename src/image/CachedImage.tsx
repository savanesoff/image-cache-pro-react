import {
  forwardRef,
  memo,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { useImage, type ImageStatus, type UseImageProps } from './useImage'

export type CachedImageProps = UseImageProps &
  Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    /** Extra class names (the element always carries data-state for styling) */
    className?: string
    /** Merged last over the component's own styles */
    style?: CSSProperties
    /** Background shown until the image is rendered (default '#222') */
    placeholderColor?: string
    /** How the bitmap fills the box (default 'fill' = exact target size) */
    fit?: 'fill' | 'cover' | 'contain'
    /** Fired once per successful render */
    onRendered?: () => void
    /** Fired on load errors */
    onError?: (error: string) => void
    /** Overlay content (badges, titles) — rendered above the image */
    children?: ReactNode
  }

const FIT: Record<NonNullable<CachedImageProps['fit']>, string> = {
  fill: '100% 100%',
  cover: 'cover',
  contain: 'contain',
}

/**
 * The ergonomic way to consume the scheduler: a `<div>`-based image (no
 * `<img>` — embedded browsers like Cobalt render background-image far more
 * predictably) that stays a colored placeholder until the engine has
 * decoded the bitmap and warmed the GPU texture, then paints in one cheap
 * step — the reveal IS the scheduling gate.
 *
 * Styling hooks: the element exposes `data-state="idle|loading|queued|
 * rendered|evicted|error"` — style transitions in CSS with exact attribute
 * selectors (Cobalt-safe), e.g.:
 *
 * ```css
 * .poster { opacity: 0.4; transition: opacity 200ms ease-out; }
 * .poster[data-state='rendered'] { opacity: 1; }
 * ```
 *
 * Cobalt notes: the box always has explicit width/height (auto-sizing paints
 * 0×0 there) and the bitmap is revealed on the REAL on-screen node.
 */
export const CachedImage = memo(
  forwardRef<HTMLDivElement, CachedImageProps>(function CachedImage(
    {
      // useImage inputs (extracted so ...rest is pure DOM props)
      url,
      width,
      height,
      priority,
      visible,
      trackProgress,
      headers,
      mimeType,
      // component props
      className,
      style,
      placeholderColor = '#222',
      fit = 'fill',
      onRendered,
      onError,
      children,
      ...rest
    },
    ref,
  ) {
    const { status, rendered, src, error } = useImage({
      url,
      width,
      height,
      priority,
      visible,
      trackProgress,
      headers,
      mimeType,
    })

    // notify via refs — callback identity must not affect the request
    const onRenderedRef = useRef(onRendered)
    const onErrorRef = useRef(onError)

    useEffect(() => {
      onRenderedRef.current = onRendered
      onErrorRef.current = onError
    })

    useEffect(() => {
      if (rendered) {
        onRenderedRef.current?.()
      }
    }, [rendered])

    useEffect(() => {
      if (error) {
        onErrorRef.current?.(error)
      }
    }, [error])

    const boxStyle = useMemo<CSSProperties>(
      () => ({
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: placeholderColor,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: FIT[fit],
        ...(rendered && src ? { backgroundImage: `url("${src}")` } : null),
        ...style,
      }),
      [width, height, placeholderColor, fit, rendered, src, style],
    )

    return (
      <div
        {...rest}
        ref={ref}
        className={className}
        style={boxStyle}
        data-state={status}
      >
        {children}
      </div>
    )
  }),
)

export type { ImageStatus }
