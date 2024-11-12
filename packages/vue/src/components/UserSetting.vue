<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import BaseInfo from './BaseInfo.vue'
  import CVInfo from './CVInfo.vue'
  import ResetAvatar from './ResetAvatar.vue'
  import ResetEmail from './ResetEmail.vue'
  import ResetPassword from './ResetPassword.vue'
  import { useUserStore } from '../stores/userStore.ts'
  let userStore = useUserStore()
  const { hrState } = storeToRefs( userStore )
  let props = defineProps<{
    tab?: string
  }>()
  const tabs = [ BaseInfo, CVInfo, ResetAvatar, ResetEmail, ResetPassword ]
  let index = ref( 0 )
  onMounted(
    () =>
    {
      if ( props.tab === 'cv' )
        index.value = 1
    }
  )
</script>

<template>
  <div class="grid">
    <aside>
      <article>
        <nav>
          <ul>
            <li
              :class=" index === 0 ? 'select' : 'normal' "
              @click.prevent=" () => ( index = 0 ) "
            >
              基本信息
            </li>
            <li
              v-if=" !hrState "
              :class=" index === 1 ? 'select' : 'normal' "
              @click.prevent=" () => ( index = 1 ) "
            >
              求职简历
            </li>
            <li
              :class=" index === 2 ? 'select' : 'normal' "
              @click.prevent=" () => ( index = 2 ) "
            >
              更改头像
            </li>
            <li
              :class=" index === 3 ? 'select' : 'normal' "
              @click.prevent=" () => ( index = 3 ) "
            >
              修改电子邮件
            </li>
            <li
              :class=" index === 4 ? 'select' : 'normal' "
              @click.prevent=" () => ( index = 4 ) "
            >
              修改密码
            </li>
            <li v-if=" !hrState ">
              实名认证
            </li>
          </ul>
        </nav>
      </article>
    </aside>
    <div>
      <Transition
        name="tab"
        mode="out-in"
        appear
      >
        <component :is=" tabs[ index ] " />
      </Transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .grid {
    grid-template-columns: max-content 1fr;
    gap: 20px;
  }

  .normal {
    cursor: pointer;

    &:hover {
      background-color: rgb(239, 241, 244);
    }
  }

  .select {
    background-color: rgb(239, 241, 244);
  }

  .tab-enter-active,
  .tab-leave-active {
    transition: all 0.3s ease-in-out;
  }

  .tab-enter-from,
  .tab-leave-to {
    transform: translateY(20px);
    opacity: 0;
  }
</style>