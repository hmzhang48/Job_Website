<script setup lang="ts">
  import { ref, watch } from "vue"
  import { validMail, existMail, register } from "../lib/connect.ts"
  const emits = defineEmits<{
    register: []
  }>()
  let step = ref(1)
  let hr: boolean
  const checkHR = (choice: boolean) => {
    hr = choice
    step.value++
  }
  const invalidKey = "aria-invalid"
  let invalid = ref<Record<string, boolean>>({})
  let email = ref("")
  let tip = ref("")
  let loading = ref(false)
  const emailRegex = new RegExp(/^\w+@\w+\.\w+$/)
  const checkEmail = async () => {
    if (emailRegex.test(email.value)) {
      loading.value = true
      let result = await existMail(email.value)
      loading.value = false
      if (result) {
        tip.value = "电子邮件地址已被注册,请直接登陆"
        invalid.value["email"] = true
      } else {
        invalid.value["email"] = false
        step.value++
      }
    } else {
      tip.value = "电子邮件地址格式不正确"
      invalid.value["email"] = true
    }
  }
  let validCode: string
  const sendCode = async () => {
    loading.value = true
    validCode = await validMail(email.value)
    loading.value = false
    if (validCode !== "") {
      countDown()
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
      step.value++
    } else {
      invalid.value["code"] = true
    }
  }
  let password = ref("")
  const checkPassword = async () => {
    if (password.value.length >= 8 && password.value.length <= 25) {
      invalid.value["password"] = false
      step.value++
    } else {
      invalid.value["password"] = true
    }
  }
  watch(step, async () => {
    if (step.value > 5) {
      loading.value = true
      const user = {
        email: email.value,
        password: password.value,
        hr: hr,
      }
      const result = await register(user)
      if (result) {
        emits("register")
      }
      loading.value = false
    }
  })
</script>

<template>
  <section>
    <article v-if="step === 1">
      <div class="grid">
        <span
          role="button"
          @click.prevent="step++">
          现在加入
        </span>
      </div>
    </article>
    <article v-if="step === 2">
      <div class="grid">
        <span
          role="button"
          @click.prevent="checkHR(false)">
          我是求职者
        </span>
        <span
          role="button"
          @click.prevent="checkHR(true)">
          我是HR
        </span>
      </div>
    </article>
    <article v-if="step === 3">
      <label>电子邮件</label>
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
      <button
        :aria-busy="loading"
        type="button"
        @click.prevent="checkEmail">
        下一步
      </button>
    </article>
    <article v-if="step === 4">
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
      <p v-show="invalid['code']">
        <small>验证码不正确</small>
      </p>
      <button
        type="button"
        @click.prevent="checkCode">
        下一步
      </button>
    </article>
    <article v-if="step >= 5">
      <label for="password">密码</label>
      <input
        id="password"
        type="password"
        placeholder="请输入密码"
        required
        :[invalidKey]="invalid['password']"
        v-model.lazy="password" />
      <p v-show="invalid['password']">
        <small>密码需8位以上</small>
      </p>
      <button
        type="submit"
        :aria-busy="loading"
        @click.prevent="checkPassword">
        注册
      </button>
    </article>
  </section>
</template>

<style scoped></style>
