<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, provide } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { storeToRefs } from 'pinia'
  import { getUserInfo } from './lib/fetch/userinfo.ts'
  import { getHRInfo } from './lib/fetch/hrinfo.ts'
  import { getCorpInfo } from './lib/fetch/corpinfo.ts'
  import { infoKey, corpKey, hrListKey, updateKey, resetKey } from './lib/inject.ts'
  import TitleNav from './components/TitleNav.vue'
  import InfoModal from './components/InfoModal.vue'
  import { useUserStore } from './stores/userStore.ts'
  import { useModalStore } from './stores/modalStore.ts'
  import { useValidStore } from './stores/validStore.ts'
  const router = useRouter()
  const route = useRoute()
  const userStore = useUserStore()
  const modalStore = useModalStore()
  const validStore = useValidStore()
  const { userState, hrState, guideState } = storeToRefs(userStore)
  const { getGuide } = userStore
  const { message } = storeToRefs(modalStore)
  const { validState, chiefState, cvState } = storeToRefs(validStore)
  router.beforeEach(to =>
    !userState.value && to.path !== '/' && to.path !== '/login'
      ? { path: '/' }
      : true,
  )
  let event: EventSource
  let newInfo = ref(0)
  onMounted(async () => getGuide())
  onUnmounted(() => event.close())
  watch(
    [userState, hrState, guideState],
    async () => {
      await stateCheck()
      if (userState.value && !guideState.value) {
        if (!event) {
          event = new EventSource('/sse', { withCredentials: true })
          event.addEventListener('newInfo', () => newInfo.value++)
        }
      }
      else {
        if (event) {
          event.close()
          newInfo.value = 0
        }
      }
    }
  )
  const start = (buttonState: number) => {
    if (buttonState)
      router.push({ name: 'index' })
    else
      router.push({ name: 'login' })
  }
  const updateInfo = () => {
    if (route.name === 'infoBox')
      router.go(0)
    else
      router.push({ name: 'infoBox' })
  }
  let info = ref(Object.create(null) as Record<string, string>)
  let corp = ref(Object.create(null) as Record<string, string>)
  let hrList = ref<{ name: string, hrId: string, avatar: string }[]>([])
  const stateCheck = async () => {
    if (userState.value)
      if (guideState.value)
        if (hrState.value)
          router.push({ name: 'guideHR' })
        else
          router.push({ name: 'guideUser' })
      else
        if (hrState.value) {
          router.push({ name: 'hrPage' })
          const hrInfo = await getHRInfo()
          const corpInfo = await getCorpInfo()
          if (hrInfo && corpInfo) {
            info.value['name'] = hrInfo.name
            info.value['avatar'] = hrInfo.avatar
            info.value['id'] = hrInfo.hrId
            info.value['phone'] = hrInfo.phone
            corp.value['corpId'] = hrInfo.corpId
            corp.value['corpName'] = corpInfo.info.corpName
            corp.value['logo'] = corpInfo.info.logo
            corp.value['brief'] = corpInfo.info.brief
            validState.value = corpInfo.info.valid ?? false
            if (corpInfo.info.hrList?.length) {
              chiefState.value = true
              hrList.value = corpInfo.info.hrList
            }
            else
              chiefState.value = false
          }
        }
        else {
          router.push({ name: 'userPage' })
          const userInfo = await getUserInfo()
          if (userInfo) {
            info.value['name'] = userInfo.name
            info.value['avatar'] = userInfo.avatar
            info.value['id'] = userInfo.id
            info.value['phone'] = userInfo.phone
            info.value['location'] = userInfo.location
            if (userInfo.cv) {
              cvState.value = true
              info.value['cv'] = userInfo.cv
            }
            validState.value = userInfo.valid
          }
        }
    else
      router.push({ name: 'index' })
  }
  provide(infoKey, info)
  provide(corpKey, corp)
  provide(hrListKey, hrList)
  provide(
    updateKey,
    (key: string, value: string) => info.value[key] = value
  )
  provide(
    resetKey,
    () => {
      info.value = Object.create(null) as Record<string, string>
      corp.value = Object.create(null) as Record<string, string>
      hrList.value = []
    }
  )
</script>

<template>
  <div class="container">
    <TitleNav
      :avatar="info['avatar']"
      :new-info="newInfo"
      @start="start"
      @update-info="updateInfo"
    >
      {{ info["name"] }}
    </TitleNav>
    <Teleport to="body">
      <InfoModal>{{ message }}</InfoModal>
    </Teleport>
    <Suspense>
      <router-view v-slot="{ Component }">
        <transition
          name="switch"
          mode="out-in"
          appear
        >
          <component :is="Component" />
        </transition>
      </router-view>
      <template #fallback>
        Loading...
      </template>
    </Suspense>
  </div>
</template>

<style scoped lang="scss">
  .switch-enter-active,
  .switch-leave-active {
    transition: all 0.3s ease-in-out;
  }
  .switch-enter-from,
  .switch-leave-to {
    transform: translateY(20px);
    opacity: 0;
  }
</style>