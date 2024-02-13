<script setup lang="ts">
  import { ref, inject, onMounted, computed } from "vue"
  import { storeToRefs } from "pinia"
  import { uploadCV } from "../lib/connect.ts"
  import { domain, infoKey, updateKey } from "../lib/help.ts"
  import { useModalStore } from "../stores/modalStore.ts"
  import { useValidStore } from "../stores/validStore.ts"
  const modalStore = useModalStore()
  const validStore = useValidStore()
  const { showModel } = modalStore
  const { cvState } = storeToRefs(validStore)
  let info = inject(infoKey)
  let update = inject(updateKey, () => {})
  let src = computed(() =>
    info?.value["cv"] ? `${domain}/fastify/PDF/${info.value["cv"]}.pdf` : "",
  )
  let embed = ref<HTMLEmbedElement>()
  onMounted(() => {
    if (info?.value["cv"] && embed.value) {
      embed.value.src = src.value
      preview.value = true
    }
  })
  let fileInput = ref<HTMLInputElement>()
  let newCV = ref<File>()
  let wrong = ref(false)
  let preview = ref(false)
  const checkFile = () => {
    let file = fileInput.value?.files?.[0]
    if (embed.value && file && file.size <= 5_242_880) {
      wrong.value = false
      newCV.value = file
      embed.value.src = URL.createObjectURL(file)
      preview.value = true
    } else {
      newCV.value = undefined
      wrong.value = true
      preview.value = false
    }
  }
  const upload = async () => {
    if (newCV.value) {
      const fileName = await uploadCV(newCV.value)
      if (fileName) {
        showModel("简历上传成功")
        cvState.value = true
        update("cv", fileName)
      } else {
        showModel("请重试")
      }
    } else {
      wrong.value = true
    }
  }
</script>

<template>
  <article>
    <div class="grid">
      <label for="file">
        <input
          name="file"
          id="file"
          type="file"
          accept="application/pdf"
          ref="fileInput"
          @change="checkFile" />
      </label>
      <button
        type="submit"
        @click.prevent="upload">
        上传
      </button>
    </div>
    <p v-show="wrong"><small>"简历PDF需小于5MB"</small></p>
    <embed
      v-show="preview"
      type="application/pdf"
      width="100%"
      height="600px"
      ref="embed" />
  </article>
</template>

<style scoped></style>
