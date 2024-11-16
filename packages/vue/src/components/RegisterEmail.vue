<script setup lang="ts">
  import { ref } from 'vue'
  import { useUserStore } from '../stores/userStore.ts'
  import { validMail, existMail, register } from '../lib/fetch/register.ts'
  const userStore = useUserStore()
  const { getGuide } = userStore
  let step = ref(1)
  let hr: boolean
  const checkHR = (choice: boolean) => {
    hr = choice
    step.value++
  }
  let invalid = ref(Object.create(null) as Record<string, boolean>)
  let email = ref('')
  let tip = ref('')
  let loading = ref(false)
  const emailRegex = new RegExp(/^\w+@\w+\.\w+$/)
  const checkEmail = async () => {
    if (emailRegex.test(email.value)) {
      loading.value = true
      let result = await existMail(email.value)
      invalid.value['email'] = result
      if (result)
        tip.value = '电子邮件地址已被注册,请直接登陆'
      else {
        await sendCode()
        step.value++
      }
      loading.value = false
    }
    else {
      tip.value = '电子邮件地址格式不正确'
      invalid.value['email'] = true
    }
  }
  let validCode: string
  let disabled = ref(false)
  const sendCode = async () => {
    disabled.value = true
    countDown()
    validCode = await validMail(email.value)
  }
  let wait = ref(60)
  const countDown = () => {
    const count = () => {
      if (wait.value > 0) {
        wait.value -= 1
        setTimeout(count, 1000)
      }
      else {
        disabled.value = false
        wait.value = 60
      }
    }
    count()
  }
  let code = ref('')
  const checkCode = () => {
    invalid.value['code'] = !(validCode !== '' && code.value === validCode)
    if (!invalid.value['code']) {
      step.value++
      disabled.value = false
    }
  }
  let password = ref('')
  const checkPassword = async () => {
    invalid.value['password'] = !(password.value.length >= 8 && password.value.length <= 25)
    if (!invalid.value['password']) await submit()
  }
  const submit = async () => {
    loading.value = true
    const result = await register({
      email: email.value, password: password.value, hr: hr,
    })
    if (result) await getGuide()
    loading.value = false
  }
</script>

<template>
  <section>
    <article v-if="step === 1">
      <div class="button">
        <button @click.prevent="step++">
          现在加入
        </button>
      </div>
    </article>
    <article v-if="step === 2">
      <div class="button">
        <button @click.prevent="checkHR(false)">
          我是求职者
        </button>
        <button @click.prevent="checkHR(true)">
          我是HR
        </button>
      </div>
    </article>
    <article v-if="step === 3">
      <label for="email">电子邮件</label>
      <input
        id="email"
        v-model.lazy="email"
        type="email"
        placeholder="请输入电子邮箱地址"
        required
        :aria-invalid="invalid['email']"
      >
      <small v-show="invalid['email']">{{ tip }}</small>
      <div class="button">
        <button
          :aria-busy="loading"
          @click.prevent="checkEmail"
        >
          下一步
        </button>
      </div>
    </article>
    <article v-if="step === 4">
      <label for="code">验证码</label>
      <fieldset role="group">
        <input
          id="code"
          v-model.lazy="code"
          type="text"
          placeholder="请输入验证码"
          required
          :aria-invalid="invalid['code']"
        >
        <input
          type="button"
          :value="disabled ? `${wait}秒后可重试` : '发送验证码'"
          :disabled="disabled"
          @click.prevent="sendCode"
        >
      </fieldset>
      <small v-show="invalid['code']">验证码不正确</small>
      <div class="button">
        <button @click.prevent="checkCode">
          下一步
        </button>
      </div>
    </article>
    <article v-if="step >= 5">
      <label for="password">密码</label>
      <input
        id="password"
        v-model.lazy="password"
        type="password"
        placeholder="请输入密码"
        required
        :aria-invalid="invalid['password']"
      >
      <small v-show="invalid['password']">密码需8位以上</small>
      <div class="button">
        <button
          :aria-busy="loading"
          @click.prevent="checkPassword"
        >
          下一步
        </button>
      </div>
    </article>
  </section>
</template>

<style scoped lang="scss">
  .button {
    display: flex;
    justify-content: center;
    gap: 50px;
  }
</style>