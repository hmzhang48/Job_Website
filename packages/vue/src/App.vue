<script setup lang="ts">
  import { ref, watch, onMounted, provide } from "vue"
  import type { Ref } from "vue"
  import { useRouter, RouterView } from "vue-router"
  import { storeToRefs } from "pinia"
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
  const { userState, hrState, guideState } = storeToRefs(userStore)
  const { getGuide } = userStore
  const { message } = storeToRefs(modalStore)
  const { validState, chiefState, cvState } = storeToRefs(validStore)
  router.beforeEach((to) =>
    !userState.value && to.path !== "/" && to.path !== "/login"
      ? { path: "/" }
      : true,
  )
  onMounted(async () => getGuide())
  watch(userState, () => stateCheck())
  const start = (buttonState: number) => {
    if (buttonState) {
      router.push({
        path: "/",
      })
    } else {
      router.push({
        path: "/login",
      })
    }
  }
  let info = ref<Record<string, string>>({})
  let corp = ref<Record<string, string>>({})
  let hrList: Ref<{ name: string; hrID: string }[]> = ref([])
  const stateCheck = async () => {
    if (userState.value) {
      if (guideState.value) {
        if (hrState.value) {
          router.push({
            path: "/guideHR",
          })
        } else {
          router.push({
            path: "/guideUser",
          })
        }
      } else {
        if (hrState.value) {
          router.push({
            path: "/HRPage",
          })
          const hrInfo = await getHRInfo()
          const corpInfo = await getCorpInfo()
          info.value.name = hrInfo.name
          info.value.avatar = hrInfo.avatar
          info.value.id = hrInfo.hrID
          info.value.phone = hrInfo.phone
          corp.value.corpID = hrInfo.corpID
          corp.value.corpName = corpInfo.info.corpName
          corp.value.logo = corpInfo.info.logo
          corp.value.brief = corpInfo.info.brief
          validState.value = corpInfo.info.valid ?? false
          if (corpInfo.list) {
            chiefState.value = true
            hrList.value = corpInfo.list
          } else {
            chiefState.value = false
          }
        } else {
          router.push({
            path: "/UserPage",
          })
          const userInfo = await getUserInfo()
          info.value.name = userInfo.name
          info.value.avatar = userInfo.avatar
          info.value.id = userInfo.id
          info.value.phone = userInfo.phone
          info.value.location = userInfo.location
          if (userInfo.cv) {
            cvState.value = true
            info.value.cv = userInfo.cv
          }
          validState.value = userInfo.valid
        }
      }
    } else {
      router.push({
        path: "/",
      })
    }
  }
  provide(infoKey, info)
  provide(corpKey, corp)
  provide(hrListKey, hrList)
  provide(updateKey, (key: string, value: string) => {
    info.value[key] = value
  })
  provide(resetKey, () => {
    info.value = {}
    corp.value = {}
    hrList.value = []
  })
</script>

<template>
  <div class="container">
    <TitleNav
      :avatar="info.avatar"
      @start="start">
      {{ info.name }}
    </TitleNav>
    <Teleport to="body">
      <InfoModal>{{ message }}</InfoModal>
    </Teleport>
    <Suspense timeout="10">
      <template #default>
        <RouterView
          @login="() => getGuide()"
          @register="() => getGuide()"
          @guide="() => (guideState = false)" />
      </template>
      <template #fallback>Loading...</template>
    </Suspense>
  </div>
</template>
