<script setup lang="ts">
  import { ref, watch, inject } from "vue"
  import { storeToRefs } from "pinia"
  import { validMail, existMail, resetMail, logout } from "../lib/connect.ts"
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
  let email = ref("")
  let tip = ref("")
  let loading = ref(false)
  const emailRegex = new RegExp(/^\w+@\w+\.\w+$/, "g")
  const checkEmail = () => {
    if (emailRegex.test(email.value)) {
      return true
    } else {
      tip.value = "电子邮件地址格式不正确"
      invalid.value["email"] = true
      return false
    }
  }
  let validCode: string | null
  const sendCode = async () => {
    if (checkEmail()) {
      loading.value = true
      let result = await existMail(email.value)
      if (result) {
        tip.value = "电子邮件地址已被注册"
        invalid.value["email"] = true
        loading.value = false
      } else {
        invalid.value["email"] = false
        validCode = await validMail(email.value)
        loading.value = false
        if (validCode) {
          countDown()
        }
      }
    }
  }
  let buttonContent = ref("发送验证码")
  let disabled = ref(false)
  const countDown = () => {
    let wait = 60
    disabled.value = true
    const count = () => {
      if (wait >= 0) {
        buttonContent.value = wait + "秒后可重试"
        wait -= 1
        setTimeout(count, 1000)
      } else {
        buttonContent.value = "请先发送验证码"
        disabled.value = false
      }
    }
    count()
  }
  let code = ref("")
  const checkCode = () => {
    if (code.value === validCode) {
      invalid.value["code"] = false
      return true
    } else {
      invalid.value["code"] = true
      return false
    }
  }
  const submit = async () => {
    if (checkCode()) {
      let result = await resetMail(email.value)
      if (result) {
        showModel("邮箱地址修改成功,请重新登陆")
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
        showModel("请重试")
      }
    }
  }
</script>

<template>
  <article>
    <label for="email">电子邮件</label>
    <input
      id="email"
      type="email"
      placeholder="请输入电子邮箱地址"
      required
      :[invalidKey]="invalid['email']"
      v-model.lazy="email" />
    <p>
      <small v-show="invalid['email']">{{ tip }}</small>
    </p>
    <label for="code">验证码</label>
    <div class="grid">
      <input
        id="code"
        type="text"
        placeholder="请输入验证码"
        required
        :[invalidKey]="invalid['code']"
        v-model.lazy="code" />
      <button
        type="button"
        :aria-busy="loading"
        :disabled="disabled"
        @click.prevent="sendCode">
        {{ buttonContent }}
      </button>
    </div>
    <p v-show="invalid['code']"><small>验证码不正确</small></p>
    <button
      type="submit"
      @click.prevent="submit">
      确认
    </button>
  </article>
</template>

<style scoped></style>
