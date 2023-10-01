<!-- @format -->

<script setup lang="ts">
  import { ref, watch } from "vue"
  import { uploadImage, postCorpInfo } from "../lib/connect.js"
  import { useCanvas, loadImage } from "../lib/help.js"
  import { useModalStore } from "../stores/modalStore.js"
  const modalStore = useModalStore()
  const props = defineProps<{
    hrid: string
    corpid: string
  }>()
  const invalidKey = "aria-invalid"
  let invalid = ref<Record<string, boolean>>({})
  let name = ref("")
  const checkName = () => {
    if (name.value === "") {
      invalid.value.name = true
    } else {
      invalid.value.name = false
    }
  }
  let origin = await loadImage("./vue.svg")
  let canvas = ref<HTMLCanvasElement>()
  let image = await useCanvas(canvas, origin)
  let logo = ref<File>()
  let logoInput = ref<HTMLInputElement>()
  watch(logo, async () => {
    if (logo.value) {
      image.value = await loadImage(logo.value)
    }
  })
  const getLogo = () => {
    return new Promise((resolve: (value: File) => void) => {
      canvas.value?.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], "logo.png", { type: "image/png" }))
        }
      })
    })
  }
  const checkLogo = async () => {
    const file = logoInput.value?.files?.[0]
    if (file && file.size < 102400) {
      logo.value = file
      invalid.value.logo = false
    } else {
      invalid.value.avatar = true
    }
  }
  let brief = ref("")
  const checkBrief = () => {
    if (brief.value === "") {
      invalid.value.brief = true
      return false
    } else {
      invalid.value.brief = false
      return true
    }
  }
  const keys = ["name", "logo", "brief"]
  const check = () => {
    let result = true
    for (let key in invalid.value) {
      if (!keys.includes(key)) {
        invalid.value[key] = true
      }
      if (invalid.value[key] && result) {
        result = false
      }
    }
    return result
  }
  const emits = defineEmits<{
    corpInfo: []
  }>()
  const submit = async () => {
    const result = check()
    if (result) {
      let result = false
      const logo = await getLogo()
      const formData = new FormData()
      formData.append("logo", logo)
      const fileName = await uploadImage(formData)
      if (fileName) {
        const corpInfo = {
          corpname: name.value,
          logo: fileName,
          corpid: props.corpid,
          brief: brief.value,
          chiefhr: props.hrid
        }
        result = await postCorpInfo(corpInfo)
      }
      if (result) {
        emits("corpInfo")
      } else {
        modalStore.showModel("请重试")
      }
    }
  }
</script>

<template>
  <section>
    <article>
      <h1>请先完善企业基本信息</h1>
      <label for="name">企业名</label>
      <input
        v-model.lazy="name"
        :[invalidKey]="invalid.name"
        @change="checkName"
        type="text"
        id="name"
        placeholder="请输入企业全称"
        required />
      <p><small v-show="invalid.name">企业全称格式有误</small></p>
      <label for="logo">企业Logo</label>
      <div class="grid">
        <div>
          <input
            type="file"
            accept="image/*"
            id="logo"
            ref="logoInput"
            @change="checkLogo" />
          <p><small v-show="invalid.logo">头像图片需小于100KB</small></p>
        </div>
        <canvas width="128" height="128" id="canvas" ref="canvas"></canvas>
      </div>
      <label for="corpid">企业ID</label>
      <input type="text" id="corpid" :placeholder="corpid" disabled />
      <label for="brief">企业介绍</label>
      <textarea
        v-model.lazy="brief"
        :[invalidKey]="invalid.brief"
        @change="checkBrief"
        type="text"
        id="phone"
        placeholder="请介绍一下企业的基本情况"
        required></textarea>
      <p><small v-show="invalid.brief">企业介绍格式有误</small></p>
      <button @click.prevent="submit" type="submit">完成</button>
    </article>
  </section>
</template>

<style scoped></style>
