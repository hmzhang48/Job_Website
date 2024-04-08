import { ref } from "vue"
import { defineStore } from "pinia"
export const useValidStore = defineStore( "valid", () => {
  const validState = ref( false )
  const cvState = ref( false )
  const chiefState = ref( false )
  return {
    validState, cvState, chiefState
  }
} )
