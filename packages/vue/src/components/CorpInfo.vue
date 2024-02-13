<script setup lang="ts">
  import { ref, watch } from "vue"
  import { uploadImage, postCorpInfo } from "../lib/connect.ts"
  import { useCanvas, loadImage } from "../lib/help.ts"
  import { useModalStore } from "../stores/modalStore.ts"
  const modalStore = useModalStore()
  const { showModel } = modalStore
  const props = defineProps<{
    hrID: string
    corpID: string
  }>()
  const emits = defineEmits<{
    corpInfo: []
  }>()
  const invalidKey = "aria-invalid"
  let invalid = ref<Record<string, boolean>>({})
  let name = ref("")
  const checkName = () => {
    invalid.value["name"] = name.value === "" ? true : false
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
    if (file && file.size < 102_400) {
      logo.value = file
      invalid.value["logo"] = false
    } else {
      invalid.value["avatar"] = true
    }
  }
  let brief = ref("")
  const checkBrief = () => {
    if (brief.value === "") {
      invalid.value["brief"] = true
      return false
    } else {
      invalid.value["brief"] = false
      return true
    }
  }
  const keys = new Set(["name", "logo", "brief"])
  const check = () => {
    let result = true
    for (let key in invalid.value) {
      if (!keys.has(key)) {
        invalid.value[key] = true
      }
      if (invalid.value[key] && result) {
        result = false
      }
    }
    return result
  }
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
          corpName: name.value,
          logo: fileName,
          corpID: props.corpID,
          brief: brief.value,
          chiefHR: props.hrID,
        }
        result = await postCorpInfo(corpInfo)
      }
      if (result) {
        emits("corpInfo")
      } else {
        showModel("请重试")
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
        id="name"
        type="text"
        placeholder="请输入企业全称"
        required
        @change="checkName"
        :[invalidKey]="invalid['name']"
        v-model.lazy="name" />
      <p><small v-show="invalid['name']">企业全称格式有误</small></p>
      <label for="logo">企业Logo</label>
      <div class="grid">
        <div>
          <input
            id="logo"
            type="file"
            accept="image/*"
            ref="logoInput"
            @change="checkLogo" />
          <p><small v-show="invalid['logo']">头像图片需小于100KB</small></p>
        </div>
        <canvas
          id="canvas"
          width="128"
          height="128"
          ref="canvas" />
      </div>
      <label for="corpid">企业ID</label>
      <input
        id="corpid"
        type="text"
        disabled
        :placeholder="corpID" />
      <label for="brief">企业介绍</label>
      <textarea
        id="phone"
        type="text"
        placeholder="请介绍一下企业的基本情况"
        required
        :[invalidKey]="invalid['brief']"
        v-model.lazy="brief"
        @change="checkBrief" />
      <p><small v-show="invalid['brief']">企业介绍格式有误</small></p>
      <button
        type="submit"
        @click.prevent="submit">
        完成
      </button>
    </article>
  </section>
</template>

<style scoped></style>
