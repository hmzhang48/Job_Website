<script setup lang="ts">
  import { ref } from "vue"
  import { login } from "../lib/connect.js"
  const emits = defineEmits<{
    login: []
  }>()
  const invalidKey = "aria-invalid"
  let invalid = ref<Record<string, boolean>>({})
  let email = ref("")
  let password = ref("")
  const check = () => {
    const emailRegex = new RegExp(/^\w+@\w+\.\w+$/)
    let result = true
    if (!emailRegex.test(email.value)) {
      invalid.value.email = true
      result = false
    }
    if (password.value.length < 8 || password.value.length > 25) {
      invalid.value.password = true
      result = false
    }
    return result
  }
  const submit = async () => {
    const result = check()
    if (result) {
      const user = {
        email: email.value,
        password: password.value,
      }
      const result = await login(user)
      switch (result) {
        case true: {
          invalid.value.email = true
          invalid.value.password = true
          emits("login")
          break
        }
        case false: {
          invalid.value.password = true
          break
        }
        default: {
          invalid.value.email = true
        }
      }
    }
  }
</script>

<template>
  <section>
    <article>
      <label for="email">电子邮件</label>
      <input
        id="email"
        type="email"
        placeholder="请输入电子邮箱地址"
        required
        :[invalidKey]="invalid.email"
        v-model.lazy="email" />
      <p v-show="invalid.email"><small>用户不存在</small></p>
      <label for="password">密码</label>
      <input
        id="password"
        type="password"
        placeholder="请输入密码"
        required
        :[invalidKey]="invalid.password"
        v-model.lazy="password" />
      <p v-show="invalid.password"><small>密码错误</small></p>
      <button
        type="submit"
        @click.prevent="submit">
        登陆
      </button>
    </article>
  </section>
</template>

<style scoped></style>
