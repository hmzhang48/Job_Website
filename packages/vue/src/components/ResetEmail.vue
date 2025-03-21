<script setup lang="ts">
  import { ref, watch, inject } from 'vue'
  import { storeToRefs } from 'pinia'
  import { validMail, existMail } from '../lib/fetch/register.ts'
  import { resetMail } from '../lib/fetch/reset.ts'
  import { logout } from '../lib/fetch/guide.ts'
  import { resetKey } from '../lib/inject.ts'
  import { useUserStore } from '../stores/userStore.ts'
  import { useModalStore } from '../stores/modalStore.ts'
  const userStore = useUserStore()
  const modalStore = useModalStore()
  const { userState } = storeToRefs(userStore)
  const { modalState } = storeToRefs(modalStore)
  const { showModel } = modalStore
  const reset = inject(resetKey, () => ({}))
  let invalid = ref(Object.create(null) as Record<string, boolean>)
  let email = ref('')
  let tip = ref('')
  const emailRegex = new RegExp(/^\w+@\w+\.\w+$/, 'g')
  const checkEmail = () => {
    resetCode()
    invalid.value['email'] = !emailRegex.test(email.value)
    if (invalid.value['email'])
      tip.value = '电子邮件地址格式不正确'
  }
  let disabled = ref(false)
  let validCode = ''
  const sendCode = async () => {
    checkEmail()
    if (!invalid.value['email']) {
      disabled.value = true
      countDown()
      invalid.value['email'] = await existMail(email.value)
      if (invalid.value['email'])
        tip.value = '电子邮件地址已被注册'
      else
        validCode = await validMail(email.value)
    }
  }
  let wait = ref(60)
  const countDown = () => {
    disabled.value = true
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
  let loading = ref(false)
  const checkCode = async () => {
    invalid.value['code'] = !(validCode && code.value === validCode)
    if (!invalid.value['code']) {
      loading.value = true
      let result = await resetMail(email.value)
      if (result) {
        showModel('邮箱地址修改成功,请重新登陆')
        watch(
          modalState,
          async () => {
            if (!modalState.value) {
              const result = await logout()
              if (result) {
                userState.value = false
                reset()
              }
            }
          }
        )
      }
      else
        showModel('请重试')
      loading.value = true
    }
  }
  const resetCode = () => {
    validCode = ''
    if (code.value !== '') {
      code.value = ''
      invalid.value['code'] = false
    }
  }
</script>

<template>
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
    <small v-show="invalid['email']">{{ tip }}</small>
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
        :value="disabled ? wait + '秒后可重试' : '请先发送验证码'"
        :disabled="disabled"
        @click.prevent="sendCode"
      >
    </fieldset>
    <small v-show="invalid['code']">验证码不正确</small>
    <div class="button">
      <button
        :aria-busy="loading"
        @click.prevent="checkCode"
      >
        确认
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
  .button {
    display: flex;
    justify-content: center;
  }
</style>