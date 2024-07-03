<script setup lang="ts">
import { ref, watch, computed, inject } from 'vue'
import { storeToRefs } from 'pinia'
import { logout } from '../lib/fetch/guide.ts'
import { resetKey } from '../lib/inject.ts'
import { useUserStore } from '../stores/userStore.ts'
import { useValidStore } from '../stores/validStore.ts'
let userStore = useUserStore()
let validStore = useValidStore()
const { userState, hrState, guideState } = storeToRefs(userStore)
const { chiefState } = storeToRefs(validStore)
const reset = inject(resetKey, () => ({}))
const props = defineProps<{
  avatar: string | undefined
  newInfo: number
}>()
const emits = defineEmits<{
  start: [state: number]
  updateInfo: []
}>()
watch(userState, () => (buttonState.value = userState.value ? 2 : 0))
let src = computed(() =>
  props.avatar ? `/image/${props.avatar}.png` : '',
)
let buttonState = ref(0)
const changeState = async () => {
  if (buttonState.value === 2) {
    const result = await logout()
    if (result) {
      userState.value = false
      reset()
    }
  }
  else {
    emits('start', buttonState.value)
    buttonState.value = buttonState.value ? 0 : 1
  }
}
</script>

<template>
  <nav>
    <ul>
      <li><strong>精银聚</strong></li>
    </ul>
    <ul>
      <li><img :src="src"></li>
      <li v-if="userState && !guideState">
        <details class="dropdown">
          <summary>
            <strong>
              <slot />
              <span :class="{ dot: newInfo }" />
            </strong>
          </summary>
          <ul>
            <li v-if="!hrState">
              <router-link :to="{ name:'userPage' }">
                工作信息
              </router-link>
            </li>
            <li v-if="hrState">
              <router-link :to="{ name:'hrPage' }">
                职位管理
              </router-link>
            </li>
            <li v-if="chiefState">
              <router-link :to="{ name:'hrSetting' }">
                企业管理
              </router-link>
            </li>
            <li>
              <router-link :to="{ name:'userSetting' }">
                个人信息
              </router-link>
            </li>
            <li>
              <a
                href=""
                @click.prevent="() => emits('updateInfo')"
              >
                信息箱
                <span
                  v-show="newInfo"
                  class="badge"
                >
                  {{ newInfo }}
                </span>
              </a>
            </li>
          </ul>
        </details>
      </li>
      <li>
        <button @click.prevent="changeState">
          {{ ["登陆", "注册", "退出"][buttonState] }}
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped lang="scss">
img {
  height: 48px;
}
%notification {
  background-color: red;
  border-radius: 100%;
  display: inline-block;
  position: relative;
  box-shadow: 1px 1px 1px 1px rgba(128, 128, 128, 0.25);
}
.dot {
  @extend %notification;
  width: 10px;
  height: 10px;
  top: -8px;
  right: 3px;
}
.badge {
  @extend %notification;
  width: 20px;
  height: 20px;
  font-size: 15px;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
  color: white;
  top: -12px;
  right: 8px;
}
</style>
