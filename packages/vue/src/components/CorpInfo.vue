<script setup lang="ts">
import { ref, watch, useTemplateRef } from 'vue'
import { uploadImage } from '../lib/fetch/image.ts'
import { postCorpInfo } from '../lib/fetch/corpinfo.ts'
import { loadImage } from '../lib/help.ts'
import { useCanvas } from '../lib/use.ts'
import { useModalStore } from '../stores/modalStore.ts'
import imgURL from '../assets/vue.svg'
const modalStore = useModalStore()
const { showModel } = modalStore
const props = defineProps<{
  hrId: string
  corpId: string
}>()
const emits = defineEmits<{
  exist: []
}>()
let invalid = ref(Object.create(null) as Record<string, boolean>)
let name = ref('')
const checkName = () => invalid.value['name'] = (name.value === '')
let origin = await loadImage(imgURL)
let canvas = useTemplateRef('canvas')
let image = useCanvas(canvas, origin)
let logo = ref<File>()
let logoInput = useTemplateRef('logoInput')
watch(logo, async () => {
  if (logo.value) {
    image.value = await loadImage(logo.value)
  }
})
const getLogo = () => {
  return new Promise((resolve: (value: File) => void) => {
    canvas.value?.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'logo.png', { type: 'image/png' }))
      }
    })
  })
}
const checkLogo = () => {
  const file = logoInput.value?.files?.[0]
  invalid.value['logo'] = !(file && file.size < 1_024_000)
  if (!invalid.value['logo']) {
    logo.value = file
  }
}
let brief = ref('')
const checkBrief = () => {
  invalid.value['brief'] = (brief.value === '')
  return !invalid.value['brief']
}
const keys = new Set(['name', 'brief'])
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
    const logo = await getLogo()
    const formData = new FormData()
    formData.append('logo', logo)
    const fileName = await uploadImage(formData)
    if (fileName) {
      result = await postCorpInfo({
        corpName: name.value,
        logo: fileName,
        corpId: props.corpId,
        brief: brief.value,
        chiefHR: props.hrId,
      })
    }
    if (result) {
      emits('exist')
    }
    else {
      showModel('请重试')
    }
    loading.value = false
  }
}
</script>

<template>
  <article>
    <h1>请先完善企业基本信息</h1>
    <label for="name">企业名</label>
    <input
      id="name"
      v-model.lazy="name"
      type="text"
      placeholder="请输入企业全称"
      required
      :aria-invalid="invalid['name']"
      @change="checkName"
    >
    <small v-show="invalid['name']">企业全称格式有误</small>
    <label for="logo">企业Logo</label>
    <div class="grid">
      <div>
        <input
          id="logo"
          ref="logoInput"
          type="file"
          accept="image/*"
          @change="checkLogo"
        >
        <small v-show="invalid['logo']">头像图片需小于1MB</small>
      </div>
      <canvas
        id="canvas"
        ref="canvas"
        width="128"
        height="128"
      />
    </div>
    <label for="corpid">企业Id</label>
    <input
      id="corpid"
      type="text"
      disabled
      :placeholder="corpId"
    >
    <label for="brief">企业介绍</label>
    <textarea
      id="phone"
      v-model.lazy="brief"
      type="text"
      placeholder="请介绍一下企业的基本情况"
      rows="10"
      required
      :aria-invalid="invalid['brief']"
      @change="checkBrief"
    />
    <small v-show="invalid['brief']">企业介绍格式有误</small>
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
