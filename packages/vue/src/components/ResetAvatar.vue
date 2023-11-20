<script setup lang="ts">
  import { ref, watch, computed, inject } from "vue"
  import { useModalStore } from "../stores/modalStore.js"
  import { resetAvatar } from "../lib/connect.js"
  import {
    useCanvas,
    loadImage,
    domain,
    infoKey,
    updateKey,
  } from "../lib/help.js"
  const modalStore = useModalStore()
  let info = inject(infoKey)
  let update = inject(updateKey, () => {
    return
  })
  let src = computed(() => {
    return info?.value.avatar
      ? `${domain}/fastify/image/${info.value.avatar}.png`
      : ""
  })
  let origin = await loadImage(src.value)
  let canvas = ref<HTMLCanvasElement>()
  let image = await useCanvas(canvas, origin)
  let newAvatar = ref<File>()
  let avatarInput = ref<HTMLInputElement>()
  let invalid = ref(false)
  watch(newAvatar, async () => {
    if (newAvatar.value) {
      image.value = await loadImage(newAvatar.value)
    }
  })
  const getAvatar = () => {
    return new Promise((resolve: (value: File) => void) => {
      canvas.value?.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], "avatar.png", { type: "image/png" }))
        }
      })
    })
  }
  const submit = async () => {
    const avatar = await getAvatar()
    const formData = new FormData()
    formData.append("avatar", avatar)
    const fileName = await resetAvatar(formData, info?.value.avatar)
    if (fileName) {
      modalStore.showModel("头像上传成功")
      update("avatar", fileName)
    } else {
      modalStore.showModel("请重试")
    }
  }
  const checkAvatar = async () => {
    const file = avatarInput.value?.files?.[0]
    if (file && file.size < 102_400) {
      newAvatar.value = file
    } else {
      invalid.value = true
    }
  }
</script>

<template>
  <article>
    <label for="avatar">头像</label>
    <div class="grid">
      <div>
        <input
          id="avatar"
          type="file"
          accept="image/*"
          ref="avatarInput"
          @change="checkAvatar" />
        <p><small v-show="invalid">头像图片需小于100KB</small></p>
        <button
          type="submit"
          @click.prevent="submit">
          上传
        </button>
      </div>
      <canvas
        id="canvas"
        width="128"
        height="128"
        ref="canvas"></canvas>
    </div>
  </article>
</template>

<style scoped></style>
