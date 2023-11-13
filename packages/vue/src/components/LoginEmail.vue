<script setup lang="ts">
import { ref } from "vue"
import { login } from "../lib/connect.js"
const invalidKey = "aria-invalid"
let invalid = ref<Record<string, boolean>>( {} )
let email = ref( "" )
let password = ref( "" )
const check = () => {
  const emailRegex = new RegExp( /^\w+@\w+\.\w+$/ )
  let result = true
  if ( !emailRegex.test( email.value ) ) {
    invalid.value.email = true
    result = false
  }
  if ( password.value.length < 8 || password.value.length > 25 ) {
    invalid.value.password = true
    result = false
  }
  return result
}
const emits = defineEmits<{
  login: []
}>()
const submit = async () => {
  const result = check()
  if ( result ) {
    const user = {
      email: email.value,
      password: password.value
    }
    const result = await login( user )
    if ( result === "success" ) {
      invalid.value.email = true
      invalid.value.password = true
      emits( "login" )
    } else {
      if ( result === "email" ) {
        invalid.value.email = true
      }
      if ( result === "password" ) {
        invalid.value.password = true
      }
    }
  }
}
</script>

<template>
  <section>
    <article>
      <label for="email">电子邮件</label>
      <input v-model.lazy=" email " :[invalidKey]=" invalid.email " type="email" id="email" placeholder="请输入电子邮箱地址"
        required />
      <p v-show=" invalid.email "><small>用户不存在</small></p>
      <label for="password">密码</label>
      <input v-model.lazy=" password " :[invalidKey]=" invalid.password " type="password" id="password" placeholder="请输入密码"
        required />
      <p v-show=" invalid.password "><small>密码错误</small></p>
      <button @click.prevent=" submit " type="submit">登陆</button>
    </article>
  </section>
</template>

<style scoped>
</style>
