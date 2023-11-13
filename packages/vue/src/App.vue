<script setup lang="ts">
import { ref, onMounted, provide } from "vue"
import type { Ref } from "vue"
import { useRouter, RouterView } from "vue-router"
import { useUserStore } from "./stores/userStore.js"
import { useModalStore } from "./stores/modalStore.js"
import { useValidStore } from "./stores/validStore.js"
import TitleNav from "./components/TitleNav.vue"
import InfoModal from "./components/InfoModal.vue"
import { getUserInfo, getHRInfo, getCorpInfo } from "./lib/connect.js"
import {
  infoKey,
  corpKey,
  hrListKey,
  updateKey,
  resetKey,
} from "./lib/help.js"
const router = useRouter()
const userStore = useUserStore()
const modalStore = useModalStore()
const validStore = useValidStore()
router.beforeEach( ( to ) => {
  if ( !userStore.userState && to.path !== "/" && to.path !== "/login" ) {
    return { path: "/" }
  } else {
    return true
  }
} )
const register = () => {
  userStore.refreshState()
}
const start = ( buttonState: number ) => {
  if ( buttonState ) {
    router.push( {
      path: "/",
    } )
  } else {
    router.push( {
      path: "/login",
    } )
  }
}
userStore.$subscribe( () => {
  stateCheck()
} )
onMounted( async () => {
  userStore.refreshState()
} )
let info = ref<Record<string, string>>( {} )
let corp = ref<Record<string, string>>( {} )
let hrList: Ref<{ name: string; hrID: string }[]> = ref( [] )
const stateCheck = async () => {
  if ( userStore.userState ) {
    if ( userStore.guideState ) {
      if ( userStore.hrState ) {
        router.push( {
          path: "/guideHR",
        } )
      } else {
        router.push( {
          path: "/guideUser",
        } )
      }
    } else {
      if ( userStore.hrState ) {
        router.push( {
          path: "/HRPage",
        } )
        const hrInfo = await getHRInfo()
        if ( hrInfo ) {
          const { result, addition } = await getCorpInfo()
          info.value.name = hrInfo.name
          info.value.avatar = hrInfo.avatar
          info.value.id = hrInfo.hrID
          info.value.phone = hrInfo.phone
          corp.value.corpID = hrInfo.corpID
          corp.value.corpname = result.corpName
          corp.value.logo = result.logo
          corp.value.brief = result.brief
          validStore.validState = result.valid as boolean
          if ( addition ) {
            validStore.chiefState = true
            hrList.value = addition
          } else {
            validStore.chiefState = false
          }
        }
      } else {
        router.push( {
          path: "/UserPage",
        } )
        const userInfo = await getUserInfo()
        if ( userInfo ) {
          info.value.name = userInfo.name
          info.value.avatar = userInfo.avatar
          info.value.id = userInfo.id
          info.value.phone = userInfo.phone
          info.value.location = userInfo.location
          if ( userInfo.cv ) {
            validStore.cvState = true
            info.value.cv = userInfo.cv
          }
          validStore.validState = userInfo.valid
        }
      }
    }
  } else {
    router.push( {
      path: "/",
    } )
  }
}
provide( infoKey, info )
provide( corpKey, corp )
provide( hrListKey, hrList )
provide( updateKey, ( key: string, value: string ) => {
  info.value[ key ] = value
} )
provide( resetKey, () => {
  info.value = {}
  corp.value = {}
  hrList.value = []
} )
const guide = () => {
  userStore.guideState = false
}
</script>

<template>
  <div class="container">
    <TitleNav @start=" start " :avatar=" info.avatar ">
      {{ info.name }}
    </TitleNav>
    <Teleport to="body">
      <InfoModal>{{ modalStore.message }}</InfoModal>
    </Teleport>
    <Suspense timeout="10">
      <template #default>
        <RouterView @login="userStore.refreshState" @register=" register " @guide=" guide ">
        </RouterView>
      </template>
      <template #fallback>Loading...</template>
    </Suspense>
  </div>
</template>
