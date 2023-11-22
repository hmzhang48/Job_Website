<script setup lang="ts">
  import { onMounted, ref } from "vue"
  import { storeToRefs } from "pinia"
  import { useUserStore } from "../stores/userStore.js"
  import BaseInfo from "./BaseInfo.vue"
  import CVInfo from "./CVInfo.vue"
  import ResetAvatar from "./ResetAvatar.vue"
  import ResetEmail from "./ResetEmail.vue"
  import ResetPassword from "./ResetPassword.vue"
  let userStore = useUserStore()
  const { hrState } = storeToRefs(userStore)
  let props = defineProps<{
    tab: string
  }>()
  const tabs = [BaseInfo, CVInfo, ResetAvatar, ResetEmail, ResetPassword]
  let index = ref(0)
  onMounted(() => {
    if (props.tab === "cv") {
      index.value = 1
    }
  })
</script>

<template>
  <aside>
    <article>
      <p>个人信息</p>
      <nav>
        <ul>
          <li @click.prevent="index = 0">基本信息</li>
          <li
            v-if="!hrState"
            @click.prevent="index = 1">
            求职简历
          </li>
          <li @click.prevent="index = 2">更改头像</li>
          <li @click.prevent="index = 3">修改电子邮件</li>
          <li @click.prevent="index = 4">修改密码</li>
          <li v-if="!hrState">实名认证</li>
        </ul>
      </nav>
    </article>
  </aside>
  <component :is="tabs[index]"></component>
</template>

<style scoped></style>
