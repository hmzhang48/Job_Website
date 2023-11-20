import { ref } from 'vue'
import { defineStore } from 'pinia'
import { guide } from "../lib/connect.js"
export const useUserStore =
  defineStore( 'user', () => {
    const userState = ref( false )
    const hrState = ref( false )
    const guideState = ref( true )
    const getGuide = async () => {
      [ userState.value, hrState.value, guideState.value ] = await guide()
    }
    return {
      userState, hrState, guideState, getGuide
    }
  } )
