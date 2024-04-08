<script setup lang="ts">
  import { ref } from "vue"
  import { useUserStore } from "../stores/userStore.ts"
  import { login } from "../lib/fetch/guide.ts"
  const userStore = useUserStore()
  const { getGuide } = userStore
  let invalid = ref<Record<string, boolean>>({})
  let email = ref("")
  let password = ref("")
  const check = () => {
    const emailRegex = new RegExp(/^\w+@\w+\.\w+$/)
    let result = true
    if (!emailRegex.test(email.value)) {
      invalid.value["email"] = true
      result = false
    }
    if (password.value.length < 8 || password.value.length > 25) {
      invalid.value["password"] = true
      result = false
    }
    return result
  }
  let loading = ref(false)
  const submit = async () => {
    const result = check()
    if (result) {
      loading.value = true
      const user = {
        email: email.value,
        password: password.value
      }
      const result = await login(user)
      switch (result) {
        case true: {
          invalid.value["email"] = true
          invalid.value["password"] = true
          getGuide()
          break
        }
        case false: {
          invalid.value["password"] = true
          break
        }
        default: {
          invalid.value["email"] = true
        }
      }
      loading.value = false
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
        :aria-invalid="invalid['email']"
        v-model.lazy="email" />
      <small v-show="invalid['email']">用户不存在</small>
      <label for="password">密码</label>
      <input
        id="password"
        type="password"
        placeholder="请输入密码"
        required
        :aria-invalid="invalid['password']"
        v-model.lazy="password" />
      <small v-show="invalid['password']">密码错误</small>
      <div class="button">
        <button
          :aria-busy="loading"
          @click.prevent="submit">
          登陆
        </button>
      </div>
    </article>
  </section>
</template>

<style scoped lang="scss">
  .button {
    display: flex;
    justify-content: center;
  }
</style>
