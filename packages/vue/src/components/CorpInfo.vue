<script setup lang="ts">
  import { ref, watch } from "vue"
  import { uploadImage } from "../lib/fetch/image.ts"
  import { postCorpInfo } from "../lib/fetch/corpinfo.ts"
  import { loadImage } from "../lib/help.ts"
  import { useCanvas } from "../lib/use.ts"
  import { useModalStore } from "../stores/modalStore.ts"
  import imgURL from "../assets/vue.svg"
  const modalStore = useModalStore()
  const { showModel } = modalStore
  const props = defineProps<{
    hrID: string
    corpID: string
  }>()
  const emits = defineEmits<{
    exist: []
  }>()
  let invalid = ref<Record<string, boolean>>({})
  let name = ref("")
  const checkName = () => {
    invalid.value["name"] = name.value === "" ? true : false
  }
  let origin = await loadImage(imgURL)
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
    if (file && file.size < 1_024_000) {
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
  let loading = ref(false)
  const submit = async () => {
    const result = check()
    if (result) {
      loading.value = true
      let result
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
          chiefHR: props.hrID
        }
        result = await postCorpInfo(corpInfo)
      }
      if (result) {
        emits("exist")
      } else {
        showModel("请重试")
      }
      loading.value = false
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
        :aria-invalid="invalid['name']"
        v-model.lazy="name" />
      <small v-show="invalid['name']">企业全称格式有误</small>
      <label for="logo">企业Logo</label>
      <div class="grid">
        <div>
          <input
            id="logo"
            type="file"
            accept="image/*"
            ref="logoInput"
            @change="checkLogo" />
          <small v-show="invalid['logo']">头像图片需小于1MB</small>
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
        rows="10"
        required
        :aria-invalid="invalid['brief']"
        v-model.lazy="brief"
        @change="checkBrief" />
      <small v-show="invalid['brief']">企业介绍格式有误</small>
      <div class="button">
        <button
          :aria-busy="loading"
          @click.prevent="submit">
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
