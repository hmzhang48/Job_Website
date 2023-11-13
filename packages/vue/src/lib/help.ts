import { provinces, cities, areas } from "./connect.js"
import { ref, watchEffect, onMounted, onUnmounted } from "vue"
import type { InjectionKey, Ref } from "vue"
export interface province {
  code: string
  name: string
}
export interface city extends province {
  provinceCode: string
}
export interface area extends city {
  cityCode: string
}
export const initProvince = ( province?: HTMLSelectElement ) => {
  if ( province ) {
    provinces.forEach( ( value ) => {
      const option = document.createElement( "option" )
      option.value = value.code
      option.text = value.name
      province.add( option )
    } )
  }
}
export const initCity =
  ( province?: HTMLSelectElement, city?: HTMLSelectElement, area?: HTMLSelectElement ) => {
    if ( province && city ) {
      const code = province.value
      removeOption( city )
      removeOption( area )
      const data = cities.filter( ( value ) => value.provinceCode === code )
      data.forEach( ( value ) => {
        const option = document.createElement( "option" )
        option.value = value.code
        option.text = value.name
        city.add( option )
      } )
    }
  }
export const initArea =
  ( city?: HTMLSelectElement, area?: HTMLSelectElement ) => {
    if ( city && area ) {
      const code = city.value
      removeOption( area )
      const data = areas.filter( ( value ) => value.cityCode === code )
      data.forEach( ( value ) => {
        const option = document.createElement( "option" )
        option.value = value.code
        option.text = value.name
        area.add( option )
      } )
    }
  }
const removeOption = ( element?: HTMLSelectElement ) => {
  if ( element ) {
    const l = element.length
    for ( let i = 1; i < l; i++ ) {
      element.remove( 1 )
    }
  }
}
export const trueLocation = ( code: string ) => {
  const areaData = areas.filter( ( value ) => value.code === code )
  const cityData = cities.filter( ( value ) => value.code === areaData[ 0 ].cityCode )
  const provinceData = provinces.filter( ( value ) => value.code === areaData[ 0 ].provinceCode )
  return provinceData[ 0 ].name + cityData[ 0 ].name + areaData[ 0 ].name
}
export const trueType = ( type: string ) => {
  if ( type === "full-time" ) {
    return "全职"
  } else {
    return "兼职"
  }
}
export const loadImage = async ( source: string | Blob ) => {
  const image = new Image( 128, 128 )
  if ( typeof source === "string" ) {
    image.src = source
  } else {
    image.src = URL.createObjectURL( source )
  }
  return new Promise( ( resolve: ( value: HTMLImageElement ) => void ) => {
    image.addEventListener( "load", () => {
      resolve( image )
    } )
  } )
}
export const useCanvas = async ( canvas: Ref<HTMLCanvasElement | undefined>, initial: HTMLImageElement ) => {
  const image = ref( initial )
  let drag = false
  const start = { x: 0, y: 0 }
  const position = { x: 0, y: 0 }
  let scale = 1
  const controller = new AbortController
  onMounted( () => {
    if ( canvas.value ) {
      const context = initContext( canvas.value )
      if ( context ) {
        canvas.value.addEventListener( "mousedown", ( event ) => {
          start.x = event.x
          start.y = event.y
          drag = true
        }, { signal: controller.signal } )
        canvas.value.addEventListener( "mousemove", ( event ) => {
          if ( drag ) {
            event.preventDefault()
            position.x = event.x - start.x
            position.y = event.y - start.y
            preview( context, image.value, position, scale )
          }
        }, { passive: false, signal: controller.signal } )
        window.addEventListener( "mouseup", () => {
          drag = false
        }, { signal: controller.signal } )
        canvas.value.addEventListener( "wheel", ( event ) => {
          event.preventDefault()
          if ( event.deltaY > 0 ) {
            scale += 0.05
          } else {
            scale -= 0.05
          }
          preview( context, image.value, position, scale )
        }, { passive: false, signal: controller.signal } )
        watchEffect( () => {
          position.x = 0
          position.y = 0
          preview( context, image.value, position, 1 )
        } )
      }
    }
  } )
  onUnmounted( () => {
    controller.abort()
  } )
  return image
}
const initContext = ( canvas: HTMLCanvasElement ) => {
  const context = canvas.getContext( "2d" )
  if ( context ) {
    context.strokeStyle = "green"
    context.clearRect( 0, 0, 128, 128 )
    context.imageSmoothingEnabled = true
    context.lineWidth = 2
    context.beginPath()
    context.arc( 64, 64, 60, 0, Math.PI * 2 )
    context.closePath()
    context.stroke()
    context.clip()
  }
  return context
}
const preview =
  ( context: CanvasRenderingContext2D, image: HTMLImageElement, position: { x: number, y: number }, scale: number ) => {
    context.clearRect( 0, 0, 128, 128 )
    context.drawImage( image, position.x, position.y, 128 * scale, 128 * scale )
  }
export const useObserver = ( element: Ref<HTMLElement | undefined>, f: () => Promise<void>, end: Ref<boolean> ) => {
  const observer = new IntersectionObserver(
    async ( entries ) => {
      entries.forEach( async () => {
        if ( !end.value ) {
          await f()
        }
      } )
    },
    { threshold: [ 1 ] }
  )
  onMounted( () => {
    if ( element.value ) {
      observer.observe( element.value )
    }
  } )

  onUnmounted( () => {
    observer.disconnect()
  } )
}
export const domain = "http://localhost:5173"
export const infoKey = Symbol() as InjectionKey<Ref<Record<string, string>>>
export const corpKey = Symbol() as InjectionKey<Ref<Record<string, string>>>
export const hrListKey = Symbol() as InjectionKey<Ref<{ name: string; hrID: string }[]>>
export const updateKey = Symbol() as InjectionKey<( key: string, value: string ) => void>
export const resetKey = Symbol() as InjectionKey<() => void>
