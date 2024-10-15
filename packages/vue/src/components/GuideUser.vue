<script setup lang="ts">
import { ref, watch, onMounted, useTemplateRef } from 'vue'
import { useUserStore } from '../stores/userStore.ts'
import { validPhone } from '../lib/fetch/register.ts'
import { uploadImage } from '../lib/fetch/image.ts'
import { postUserInfo } from '../lib/fetch/userinfo.ts'
import { initProvince, initCity, initArea, loadImage } from '../lib/help.ts'
import { useCanvas } from '../lib/use.ts'
import imgURL from '../assets/vue.svg'
const userStore = useUserStore()
const { getGuide } = userStore
let invalid = ref(Object.create(null) as Record<string, boolean>)
let name = ref('')
const checkName = () => invalid.value['name'] = (name.value === '')
let initial = await loadImage(imgURL)
let canvas = useTemplateRef('canvas')
let image = useCanvas(canvas, initial)
let avatar = ref<File>()
let avatarInput = useTemplateRef('avatarInput')
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
let id = ref('')
const idRegex = new RegExp(/^\d{17}([\dXx])$/)
const checkId = () => invalid.value['id'] = !idRegex.test(id.value)
let provinceSelect = useTemplateRef('provinceSelect')
let citySelect = useTemplateRef('citySelect')
let areaSelect = useTemplateRef('areaSelect')
onMounted(() => initProvince(provinceSelect.value))
const addCity = () => {
  initCity(provinceSelect.value, citySelect.value, areaSelect.value)
  area.value = 'area'
  checkArea()
}
const addArea = () => {
  initArea(citySelect.value, areaSelect.value)
  area.value = 'area'
  checkArea()
}
let area = ref('area')
const checkArea = () => invalid.value['area'] = (area.value === 'area')
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
const keys = ['name', 'id', 'area', 'phone', 'code']
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
let loading = ref(false)
const submit = async () => {
  if (check()) {
    loading.value = true
    let result
    const avatar = await getAvatar()
    const formData = new FormData()
    formData.append('avatar', avatar)
    const fileName = await uploadImage(formData)
    if (fileName) {
      result = await postUserInfo({
        name: name.value,
        avatar: fileName,
        id: id.value,
        location: area.value,
        phone: phone.value,
      })
    }
    if (result) {
      await getGuide()
    }
    loading.value = false
  }
}
</script>

<template>
  <section>
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
      <label for="id">身份证号</label>
      <input
        id="id"
        v-model.lazy="id"
        type="text"
        placeholder="请输入身份证号"
        required
        :aria-invalid="invalid['id']"
        @change="checkId"
      >
      <small v-show="invalid['id']">身份证号格式有误</small>
      <label for="location">居住地</label>
      <fieldset role="group">
        <select
          id="province"
          ref="provinceSelect"
          :aria-invalid="invalid['area']"
          @change="addCity"
        >
          <option
            value="province"
            selected
          >
            省(直辖市)
          </option>
        </select>
        <select
          id="city"
          ref="citySelect"
          :aria-invalid="invalid['area']"
          @change="addArea"
        >
          <option
            value="city"
            selected
          >
            市
          </option>
        </select>
        <select
          id="area"
          ref="areaSelect"
          v-model.lazy="area"
          :aria-invalid="invalid['area']"
          @change="checkArea"
        >
          <option
            value="area"
            selected
          >
            区(县)
          </option>
        </select>
      </fieldset>
      <small v-show="invalid['area']">居住地未选择</small>
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
  </section>
</template>

<style scoped lang="scss">
.button {
  display: flex;
  justify-content: center;
}
</style>
