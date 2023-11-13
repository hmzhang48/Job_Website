import { ref } from 'vue'
import { defineStore } from 'pinia'
import { guide } from "../lib/connect.js"
export const useUserStore =
  defineStore( 'user', () => {
    const userState = ref( false )
    const hrState = ref( false )
    const guideState = ref( true )
    const refreshState = async () => {
      const result = await guide()
      if ( result.user ) {
        userState.value = true
        if ( result.hr ) {
          hrState.value = true
          if ( result.guide ) {
            guideState.value = true
          } else {
            guideState.value = false
          }
        } else {
          hrState.value = false
          if ( result.guide ) {
            guideState.value = true
          } else {
            guideState.value = false
          }
        }
      } else {
        userState.value = false
      }
    }
    return {
      userState, hrState, guideState, refreshState
    }
  } )
