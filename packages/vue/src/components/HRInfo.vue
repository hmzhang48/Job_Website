<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUserStore } from '../stores/userStore.ts'
import { validPhone } from '../lib/fetch/register.ts'
import { uploadImage } from '../lib/fetch/image.ts'
import { existCorp } from '../lib/fetch/corpinfo.ts'
import { postHRInfo } from '../lib/fetch/hrinfo.ts'
import { loadImage } from '../lib/help.ts'
import { useCanvas } from '../lib/use.ts'
import imgURL from '../assets/vue.svg'
const userStore = useUserStore()
const { getGuide } = userStore
const id = defineModel<{
  hrId: string
  corpId: string
}>({ required: true })
const props = defineProps<{
  exist: boolean
}>()
watch(
  () => props.exist,
  async () => {
    if (props.exist) {
      const result = await upload()
      if (result) {
        await getGuide()
      }
    }
  },
)
const emits = defineEmits<{
  modal: []
}>()
let invalid = ref(Object.create(null) as Record<string, boolean>)
let name = ref('')
const checkName = () => invalid.value['name'] = (name.value === '')
let origin = await loadImage(imgURL)
let canvas = ref<HTMLCanvasElement>()
let image = useCanvas(canvas, origin)
let avatar = ref<File>()
let avatarInput = ref<HTMLInputElement>()
watch(avatar, async () => {
  if (avatar.value) {
    image.value = await loadImage(avatar.value)
  }
})
const getAvatar = () => {
  return new Promise((resolve: (value: File) => void) => {
    canvas.value?.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'avatar.png', { type: 'image/png' }))
      }
    })
  })
}
const checkAvatar = () => {
  const file = avatarInput.value?.files?.[0]
  invalid.value['avatar'] = !(file && file.size < 1_024_000)
  avatar.value = invalid.value['avatar'] ? undefined : file
}
let hrId = ref('')
const checkHRId = () => invalid.value['hrId'] = (hrId.value === '')
let corpId = ref('')
const corpIdRegex = new RegExp(
  /^[\dA-HJ-NP-RTUW-Y]{2}\d{6}[\dA-HJ-NP-RTUW-Y]{10}$/, 'i',
)
const checkCorpId = () => invalid.value['corpId'] = !corpIdRegex.test(corpId.value)
let phone = ref('')
const phoneRegex = new RegExp(/^\d{11}$/)
const checkPhone = () => {
  resetCode()
  invalid.value['phone'] = !phoneRegex.test(phone.value)
}
let validCode = ''
let disabled = ref(false)
const sendCode = async () => {
  if (invalid.value['phone'] === false) {
    disabled.value = true
    countDown()
    validCode = await validPhone(phone.value)
  }
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
const checkCode = () => invalid.value['code'] = !(validCode !== '' && code.value === validCode)
const resetCode = () => {
  validCode = ''
  if (code.value !== '') {
    code.value = ''
    invalid.value['code'] = true
  }
}
const keys = new Set(['name', 'hrId', 'corpId', 'phone', 'code'])
const check = () => {
  for (let key of keys) {
    if (invalid.value[key] === undefined) {
      invalid.value[key] = true
    }
    if (invalid.value[key]) {
      return false
    }
  }
  return true
}
const upload = async () => {
  const avatar = await getAvatar()
  const formData = new FormData()
  formData.append('avatar', avatar)
  const fileName = await uploadImage(formData)
  return fileName
    ? (await postHRInfo({
        name: name.value,
        avatar: fileName,
        hrId: hrId.value,
        corpId: corpId.value,
        phone: phone.value,
      }))
    : false
}
let loading = ref(false)
const submit = async () => {
  if (check()) {
    loading.value = true
    let result = await existCorp(corpId.value)
    if (result) {
      result = await upload()
      if (result) {
        await getGuide()
      }
    }
    else {
      id.value.hrId = hrId.value
      id.value.corpId = corpId.value
      emits('modal')
    }
    loading.value = false
  }
}
</script>

<template>
  <article>
    <h1>请先完善个人基本信息</h1>
    <label for="name">姓名</label>
    <input
      id="name"
      v-model.lazy="name"
      type="text"
      placeholder="请输入真实姓名"
      required
      :aria-invalid="invalid['name']"
      @change="checkName"
    >
    <small v-show="invalid['name']">姓名格式有误</small>
    <label for="avatar">头像</label>
    <div class="grid">
      <div>
        <input
          id="avatar"
          ref="avatarInput"
          type="file"
          accept="image/*"
          @change="checkAvatar"
        >
        <small v-show="invalid['avatar']">头像图片需小于1MB</small>
      </div>
      <canvas
        id="canvas"
        ref="canvas"
        width="128"
        height="128"
      />
    </div>
    <label for="hrId">工号</label>
    <input
      id="hrId"
      v-model.lazy="hrId"
      type="text"
      placeholder="请填写工号"
      required
      :aria-invalid="invalid['hrId']"
      @change="checkHRId"
    >
    <small v-show="invalid['hrId']">工号格式有误</small>
    <label for="corpId">企业Id</label>
    <input
      id="corpId"
      v-model.lazy="corpId"
      type="text"
      placeholder="请填写企业统一社会信用代码"
      required
      :aria-invalid="invalid['corpId']"
      @change="checkCorpId"
    >
    <small v-show="invalid['corpId']">统一社会信用代码格式有误</small>
    <label for="phone">电话</label>
    <input
      id="phone"
      v-model.lazy="phone"
      type="text"
      placeholder="请输入手机号码"
      required
      :aria-invalid="invalid['phone']"
      @change="checkPhone"
    >
    <small v-show="invalid['phone']">手机号格式有误</small>
    <label for="code">验证码</label>
    <fieldset role="group">
      <input
        id="code"
        v-model.lazy="code"
        type="text"
        placeholder="请输入验证码"
        required
        :aria-invalid="invalid['code']"
        @change="checkCode"
      >
      <input
        type="button"
        :value="disabled ? `${wait}秒后可重试` : '发送验证码'"
        :disabled="disabled"
        @click.prevent="sendCode"
      >
    </fieldset>
    <small v-show="invalid['code']">验证码有误</small>
    <div class="button">
      <button
        :aria-busy="loading"
        @click.prevent="submit"
      >
        完成
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
