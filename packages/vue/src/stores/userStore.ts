import { ref } from 'vue'
import { defineStore } from 'pinia'
import { guide } from '../lib/fetch/guide.ts'
export const useUserStore = defineStore(
  'user',
  () => {
    const userState = ref(false)
    const hrState = ref(false)
    const guideState = ref(true)
    const getGuide = async () => {
      const state = await guide()
      if (state) {
        userState.value = true
        hrState.value = state.hr
        guideState.value = state.guide
      }
    }
    return {
      userState, hrState, guideState,
      getGuide,
    }
  }
)
