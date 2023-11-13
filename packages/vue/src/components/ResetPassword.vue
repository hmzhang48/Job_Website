<script setup lang="ts">
import { ref, inject } from "vue"
import { useUserStore } from "../stores/userStore.js"
import { useModalStore } from "../stores/modalStore.js"
import { resetPassword, logout } from "../lib/connect.js"
import { resetKey } from "../lib/help.js"
const userStore = useUserStore()
const modalStore = useModalStore()
const invalidKey = "aria-invalid"
let invalid = ref<Record<string, boolean>>( {} )
let oldPassword = ref( "" )
let newPassword = ref( "" )
const check = ( password: string ) => {
  if ( password.length >= 8 && password.length <= 25 ) {
    return true
  } else {
    return false
  }
}
const reset = inject( resetKey, () => { } )
const submit = async () => {
  if ( check( oldPassword.value ) ) {
    invalid.value.oldPassword = false
  } else {
    invalid.value.oldPassword = true
  }
  if ( check( newPassword.value ) ) {
    invalid.value.newPassword = false
  } else {
    invalid.value.newPassword = true
  }
  if ( !invalid.value.newPassword && !invalid.value.oldPassword ) {
    let r = await resetPassword( oldPassword.value, newPassword.value )
    if ( r === "修改成功" ) {
      modalStore.showModel( "密码修改成功,请重新登陆" )
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
      modalStore.showModel( r )
    }
  }
}
</script>

<template>
  <article>
    <label for="oldPassword">原密码</label>
    <input v-model.lazy=" oldPassword " :[invalidKey]=" invalid.oldPassword " type="password" id="oldPassword"
      placeholder="请输入密码" required />
    <p v-show=" invalid.oldPassword "><small>密码需8位以上</small></p>
    <label for="newPassword">新密码</label>
    <input v-model.lazy=" newPassword " :[invalidKey]=" invalid.newPassword " type="password" id="newPassword"
      placeholder="请输入密码" required />
    <p v-show=" invalid.newPassword "><small>密码需8位以上</small></p>
    <button @click.prevent=" submit " type="submit">确认</button>
  </article>
</template>

<style scoped>
</style>
