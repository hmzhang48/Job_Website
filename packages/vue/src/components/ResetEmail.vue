<script setup lang="ts">
import { ref, inject } from "vue"
import { useUserStore } from "../stores/userStore.js"
import { useModalStore } from "../stores/modalStore.js"
import { validMail, existMail, resetMail, logout } from "../lib/connect.js"
import { resetKey } from "../lib/help.js"
const userStore = useUserStore()
const modalStore = useModalStore()
const invalidKey = "aria-invalid"
let invalid = ref<Record<string, boolean>>( {} )
let email = ref( "" )
let tip = ref( "" )
let loading = ref( false )
const emailRegex = new RegExp( /^\w+@\w+\.\w+$/, "g" )
const checkEmail = () => {
  if ( !emailRegex.test( email.value ) ) {
    tip.value = "电子邮件地址格式不正确"
    invalid.value.email = true
    return false
  } else {
    return true
  }
}
let validCode: string | null
const sendCode = async () => {
  if ( checkEmail() ) {
    loading.value = true
    let result = await existMail( email.value )
    if ( result ) {
      tip.value = "电子邮件地址已被注册"
      invalid.value.email = true
      loading.value = false
    } else {
      invalid.value.email = false
      validCode = await validMail( email.value )
      loading.value = false
      if ( validCode ) {
        countDown()
      }
    }
  }
}
let buttonContent = ref( "发送验证码" )
let disabled = ref( false )
const countDown = () => {
  let wait = 60
  disabled.value = true
  const count = () => {
    if ( wait >= 0 ) {
      buttonContent.value = wait + "秒后可重试"
      wait -= 1
      setTimeout( count, 1000 )
    } else {
      buttonContent.value = "请先发送验证码"
      disabled.value = false
    }
  }
  count()
}
let code = ref( "" )
const checkCode = () => {
  if ( code.value === validCode ) {
    invalid.value.code = false
    return true
  } else {
    invalid.value.code = true
    return false
  }
}
const reset = inject( resetKey, () => { } )
const submit = async () => {
  if ( checkCode() ) {
    let result = await resetMail( email.value )
    if ( result ) {
      modalStore.showModel( "邮箱地址修改成功,请重新登陆" )
      modalStore.$subscribe( async ( _, state ) => {
        if ( !state.modalState ) {
          const result = await logout()
          if ( result ) {
            userStore.userState = false
            reset()
          }
        }
      } )
    } else {
      modalStore.showModel( "请重试" )
    }
  }
}
</script>

<template>
  <article>
    <label for="email">电子邮件</label>
    <input v-model.lazy=" email " :[invalidKey]=" invalid.email " type="email" id="email" placeholder="请输入电子邮箱地址" required />
    <p>
      <small v-show=" invalid.email ">{{ tip }}</small>
    </p>
    <label for="code">验证码</label>
    <div class="grid">
      <input v-model.lazy=" code " :[invalidKey]=" invalid.code " type="text" id="code" placeholder="请输入验证码" required />
      <button :aria-busy=" loading " :disabled=" disabled " @click.prevent=" sendCode " type="button">
        {{ buttonContent }}
      </button>
    </div>
    <p v-show=" invalid.code "><small>验证码不正确</small></p>
    <button @click.prevent=" submit " type="submit">确认</button>
  </article>
</template>

<style scoped>
</style>
