<script setup lang="ts">
  import { ref, watch, computed, inject } from "vue"
  import { resetAvatar } from "../lib/fetch/image.ts"
  import { loadImage } from "../lib/help.ts"
  import { useCanvas } from "../lib/use.ts"
  import { infoKey, updateKey } from "../lib/inject.ts"
  import { useModalStore } from "../stores/modalStore.ts"
  const modalStore = useModalStore()
  const { showModel } = modalStore
  let info = inject(infoKey)
  let update = inject(updateKey, () => {})
  let src = computed(() =>
    info?.value["avatar"] ? `/fastify/image/${info.value["avatar"]}.png` : ""
  )
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
  let loading = ref(false)
  const submit = async () => {
    if (info?.value["avatar"]) {
      loading.value = true
      const avatar = await getAvatar()
      const formData = new FormData()
      formData.append("avatar", avatar)
      const fileName = await resetAvatar(formData, info.value["avatar"])
      if (fileName) {
        showModel("头像上传成功")
        update("avatar", fileName)
        loading.value = false
      } else {
        showModel("请重试")
      }
    }
  }
  const checkAvatar = async () => {
    const file = avatarInput.value?.files?.[0]
    if (file && file.size < 1_024_000) {
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
        <p><small v-show="invalid">头像图片需小于1MB</small></p>
        <div class="button">
          <button
            :aria-busy="loading"
            @click.prevent="submit">
            上传
          </button>
        </div>
      </div>
      <canvas
        id="canvas"
        width="128"
        height="128"
        ref="canvas"></canvas>
    </div>
  </article>
</template>

<style scoped lang="scss">
  .grid {
    grid-template-columns: 1fr max-content;
    gap: 10px;
  }
  .button {
    display: flex;
    justify-content: center;
  }
</style>
