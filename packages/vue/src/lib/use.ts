import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
export const useCanvas = ( canvas: Ref<HTMLCanvasElement | null>, initial: HTMLImageElement ) =>
{
  const image = ref( initial )
  let drag = false
  const start = { x: 0, y: 0 }
  const position = { x: 0, y: 0 }
  let scale = 1
  const controller = new AbortController()
  onMounted(
    () =>
    {
      if ( canvas.value )
      {
        const context = canvas.value.getContext( '2d' )
        if ( context )
        {
          context.strokeStyle = 'green'
          context.imageSmoothingEnabled = true
          context.lineWidth = 5
          context.beginPath()
          context.arc( 64, 64, 60, 0, Math.PI * 2 )
          context.closePath()
          context.stroke()
          context.clip()
          context.clearRect( 0, 0, 128, 128 )
          context.drawImage( image.value, 0, 0, 128, 128 )
          canvas.value.addEventListener(
            'mousedown',
            ( event ) =>
            {
              start.x = event.x
              start.y = event.y
              drag = true
            }, { signal: controller.signal }
          )
          canvas.value.addEventListener(
            'mousemove',
            ( event ) =>
            {
              if ( drag )
              {
                event.preventDefault()
                position.x = event.x - start.x
                position.y = event.y - start.y
                context.clearRect( 0, 0, 128, 128 )
                context.drawImage(
                  image.value,
                  position.x,
                  position.y,
                  128 * scale,
                  128 * scale,
                )
              }
            }, { passive: false, signal: controller.signal }
          )
          globalThis.addEventListener(
            'mouseup',
            () => drag = false,
            { signal: controller.signal }
          )
          canvas.value.addEventListener(
            'wheel',
            ( event ) =>
            {
              event.preventDefault()
              if ( event.deltaY > 0 )
                scale += 0.05
              else
                scale -= 0.05
              context.clearRect( 0, 0, 128, 128 )
              context.drawImage(
                image.value,
                position.x,
                position.y,
                128 * scale,
                128 * scale,
              )
            }, { passive: false, signal: controller.signal }
          )
          watch(
            image,
            () =>
            {
              position.x = 0
              position.y = 0
              context.clearRect( 0, 0, 128, 128 )
              context.drawImage( image.value, 0, 0, 128, 128 )
            }
          )
        }
      }
    }
  )
  onUnmounted(
    () => controller.abort()
  )
  return image
}
export const useObserver = ( element: Ref<HTMLElement | null>, load: Ref<boolean> ) =>
{
  let intersectionRatio = 0
  const observer = new IntersectionObserver(
    ( entries ) =>
    {
      for ( const entry of entries )
      {
        load.value = entry.intersectionRatio > intersectionRatio ? true : false
        intersectionRatio = entry.intersectionRatio
      }
    },
    { threshold: [ 0, 1 ] },
  )
  onMounted(
    () =>
    {
      if ( element.value ) observer.observe( element.value )
    }
  )
  onUnmounted(
    () => observer.disconnect()
  )
}
