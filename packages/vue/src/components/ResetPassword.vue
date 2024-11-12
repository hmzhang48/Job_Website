<script setup lang="ts">
  import { ref, watch, inject } from 'vue'
  import { storeToRefs } from 'pinia'
  import { resetPassword } from '../lib/fetch/reset.ts'
  import { logout } from '../lib/fetch/guide.ts'
  import { resetKey } from '../lib/inject.ts'
  import { useUserStore } from '../stores/userStore.ts'
  import { useModalStore } from '../stores/modalStore.ts'
  const userStore = useUserStore()
  const modalStore = useModalStore()
  const { userState } = storeToRefs( userStore )
  const { modalState } = storeToRefs( modalStore )
  const { showModel } = modalStore
  const reset = inject( resetKey, () => ( {} ) )
  let invalid = ref( Object.create( null ) as Record<string, boolean> )
  let oldPassword = ref( '' )
  let newPassword = ref( '' )
  const check = ( password: string ) =>
    password.length >= 8 && password.length <= 25 ? true : false
  let loading = ref( false )
  const submit = async () =>
  {
    invalid.value[ 'oldPassword' ] = check( oldPassword.value ) ? false : true
    invalid.value[ 'newPassword' ] = check( newPassword.value ) ? false : true
    if ( !invalid.value[ 'newPassword' ] && !invalid.value[ 'oldPassword' ] )
    {
      loading.value = true
      const result = await resetPassword( oldPassword.value, newPassword.value )
      if ( result === '修改成功' )
      {
        showModel( '密码修改成功,请重新登陆' )
        watch(
          modalState,
          async () =>
          {
            if ( !modalState.value )
            {
              const result = await logout()
              if ( result )
              {
                userState.value = false
                reset()
              }
            }
          }
        )
      }
      else
        showModel( result ?? '非法用户' )
      loading.value = false
    }
  }
</script>

<template>
  <article>
    <label for="oldPassword">原密码</label>
    <input
      id="oldPassword"
      v-model.lazy=" oldPassword "
      type="password"
      placeholder="请输入密码"
      required
      :aria-invalid=" invalid[ 'oldPassword' ] "
    >
    <small v-show=" invalid[ 'oldPassword' ] ">密码需8位以上</small>
    <label for="newPassword">新密码</label>
    <input
      id="newPassword"
      v-model.lazy=" newPassword "
      type="password"
      placeholder="请输入密码"
      required
      :aria-invalid=" invalid[ 'newPassword' ] "
    >
    <small v-show=" invalid[ 'newPassword' ] ">密码需8位以上</small>
    <div class="button">
      <button
        :aria-busy=" loading "
        @click.prevent=" submit "
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