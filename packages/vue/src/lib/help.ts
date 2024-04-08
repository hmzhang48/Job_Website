import provinces from "../assets/provinces.json"
import cities from "../assets/cities.json"
import areas from "../assets/areas.json"
export const initProvince =
  ( province?: HTMLSelectElement ) => {
    if ( province ) {
      for ( const value of provinces ) {
        const option = document.createElement( "option" )
        option.value = value.code
        option.text = value.name
        province.add( option )
      }
    }
  }
export const initCity =
  ( province?: HTMLSelectElement, city?: HTMLSelectElement, area?: HTMLSelectElement ) => {
    if ( province && city ) {
      const code = province.value
      removeOption( city )
      removeOption( area )
      const data = cities.filter( ( value ) => value.provinceCode === code )
      for ( const value of data ) {
        const option = document.createElement( "option" )
        option.value = value.code
        option.text = value.name
        city.add( option )
      }
    }
  }
export const initArea =
  ( city?: HTMLSelectElement, area?: HTMLSelectElement ) => {
    if ( city && area ) {
      const code = city.value
      removeOption( area )
      const data = areas.filter( ( value ) => value.cityCode === code )
      for ( const value of data ) {
        const option = document.createElement( "option" )
        option.value = value.code
        option.text = value.name
        area.add( option )
      }
    }
  }
export const removeOption =
  ( element?: HTMLSelectElement ) => {
    if ( element ) {
      const l = element.length
      for ( let index = 1; index < l; index++ ) {
        element.remove( 1 )
      }
    }
  }
export const trueLocation = ( code: string ) => {
  const area = areas.find( ( value ) => value.code === code )
  const city = cities.find( ( value ) => value.code === area?.cityCode )
  const province = provinces.find( ( value ) => value.code === area?.provinceCode )
  return province && city && area ? province.name + city.name + area.name : ""
}
export const trueType =
  ( type: string ) => type === "full-time" ? "全职" : "兼职"
export const loadImage =
  async ( source: string | Blob ) => {
    const image = new Image( 128, 128 )
    image.src = typeof source === "string" ? source : URL.createObjectURL( source )
    return new Promise( ( resolve: ( value: HTMLImageElement ) => void ) => {
      image.addEventListener( "load", () => resolve( image ) )
    } )
  }
