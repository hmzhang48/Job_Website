<script setup lang="ts">
  import { ref, computed, inject } from "vue"
  import { RouterLink } from "vue-router"
  import { useUserStore } from "../stores/userStore.js"
  import { useValidStore } from "../stores/validStore.js"
  import { logout } from "../lib/connect.js"
  import { domain, resetKey } from "../lib/help.js"
  let userStore = useUserStore()
  let validStore = useValidStore()
  userStore.$subscribe((_, state) => {
    buttonState.value = state.userState ? 2 : 0
  })
  const props = defineProps<{
    avatar: string | undefined
  }>()
  const emits = defineEmits<{
    start: [state: number]
  }>()
  let src = computed(() => {
    return props.avatar ? `${domain}/fastify/image/${props.avatar}.png` : ""
  })
  const buttonContent = ["登陆", "注册", "退出"]
  let buttonState = ref(0)
  const reset = inject(resetKey, () => {
    return
  })
  const changeState = async () => {
    if (buttonState.value === 2) {
      const result = await logout()
      if (result) {
        userStore.userState = false
        reset()
      }
    } else {
      emits("start", buttonState.value)
      buttonState.value = buttonState.value ? 0 : 1
    }
  }
</script>

<template>
  <nav>
    <ul>
      <li><strong>精银聚</strong></li>
    </ul>
    <ul>
      <li><img :src="src" /></li>
      <li v-if="userStore.userState && !userStore.guideState">
        <details role="list">
          <summary
            aria-haspopup="listbox"
            role="link">
            <span>
              <slot></slot>
            </span>
          </summary>
          <ul role="listbox">
            <li v-if="!userStore.hrState">
              <RouterLink to="/userPage">工作信息</RouterLink>
            </li>
            <li v-if="userStore.hrState">
              <RouterLink to="/hrPage">职位管理</RouterLink>
            </li>
            <li v-if="validStore.chiefState">
              <RouterLink to="/hrSetting">企业管理</RouterLink>
            </li>
            <li>
              <RouterLink to="/userSetting/default">个人信息</RouterLink>
            </li>
            <li>
              <RouterLink to="/infoBox">信息箱</RouterLink>
            </li>
          </ul>
        </details>
      </li>
      <li>
        <span
          role="button"
          @click.prevent="changeState">
          {{ buttonContent[buttonState] }}
        </span>
      </li>
    </ul>
  </nav>
</template>

<style scoped></style>
