import { ref } from 'vue'
import { defineStore } from 'pinia'
export const useModalStore =
  defineStore( 'modal', () => {
    const modalState = ref( false )
    const footerState = ref( false )
    const confirmState = ref( false )
    const message = ref( "" )
    const showModel = ( info: string, footer?: boolean ) => {
      message.value = info
      modalState.value = true
      if ( footer ) {
        footerState.value = true
      }
    }
    return {
      modalState, footerState, confirmState, message, showModel
    }
  } )
