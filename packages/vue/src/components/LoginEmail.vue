<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../stores/userStore.ts'
import { login } from '../lib/fetch/guide.ts'
const userStore = useUserStore()
const { getGuide } = userStore
let invalid = ref(Object.create(null) as Record<string, boolean>)
let email = ref('')
let password = ref('')
const emailRegex = new RegExp(/^\w+@\w+\.\w+$/)
const check = () => {
  invalid.value['email'] = !emailRegex.test(email.value)
  invalid.value['password'] = (password.value.length < 8 || password.value.length > 25)
  return !(invalid.value['email'] || invalid.value['password'])
}
let loading = ref(false)
const submit = async () => {
  if (check()) {
    loading.value = true
    const result = await login({
      email: email.value, password: password.value,
    })
    switch (result) {
      case true: {
        await getGuide()
        break
      }
      case false: {
        invalid.value['password'] = true
        break
      }
      case undefined: {
        invalid.value['email'] = true
        break
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
        v-model.lazy="email"
        type="email"
        placeholder="请输入电子邮箱地址"
        required
        :aria-invalid="invalid['email']"
      >
      <small v-show="invalid['email']">用户不存在</small>
      <label for="password">密码</label>
      <input
        id="password"
        v-model.lazy="password"
        type="password"
        placeholder="请输入密码"
        required
        :aria-invalid="invalid['password']"
      >
      <small v-show="invalid['password']">密码错误</small>
      <div class="button">
        <button
          :aria-busy="loading"
          @click.prevent="submit"
        >
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
