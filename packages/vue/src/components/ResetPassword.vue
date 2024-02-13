<script setup lang="ts">
  import { ref, watch, inject } from "vue"
  import { storeToRefs } from "pinia"
  import { resetPassword, logout } from "../lib/connect.ts"
  import { resetKey } from "../lib/help.ts"
  import { useUserStore } from "../stores/userStore.ts"
  import { useModalStore } from "../stores/modalStore.ts"
  const userStore = useUserStore()
  const modalStore = useModalStore()
  const { userState } = storeToRefs(userStore)
  const { modalState } = storeToRefs(modalStore)
  const { showModel } = modalStore
  const reset = inject(resetKey, () => {})
  const invalidKey = "aria-invalid"
  let invalid = ref<Record<string, boolean>>({})
  let oldPassword = ref("")
  let newPassword = ref("")
  const check = (password: string) =>
    password.length >= 8 && password.length <= 25 ? true : false
  const submit = async () => {
    invalid.value["oldPassword"] = check(oldPassword.value) ? false : true
    invalid.value["newPassword"] = check(newPassword.value) ? false : true
    if (!invalid.value["newPassword"] && !invalid.value["oldPassword"]) {
      const result = await resetPassword(oldPassword.value, newPassword.value)
      if (result === "修改成功") {
        showModel("密码修改成功,请重新登陆")
        watch(modalState, async () => {
          if (!modalState.value) {
            const result = await logout()
            if (result) {
              userState.value = false
              reset()
            }
          }
        })
      } else {
        showModel(result)
      }
    }
  }
</script>

<template>
  <article>
    <label for="oldPassword">原密码</label>
    <input
      id="oldPassword"
      type="password"
      placeholder="请输入密码"
      required
      :[invalidKey]="invalid['oldPassword']"
      v-model.lazy="oldPassword" />
    <p v-show="invalid['oldPassword']"><small>密码需8位以上</small></p>
    <label for="newPassword">新密码</label>
    <input
      id="newPassword"
      type="password"
      placeholder="请输入密码"
      required
      :[invalidKey]="invalid['newPassword']"
      v-model.lazy="newPassword" />
    <p v-show="invalid['newPassword']"><small>密码需8位以上</small></p>
    <button
      @click.prevent="submit"
      type="submit">
      确认
    </button>
  </article>
</template>

<style scoped></style>
