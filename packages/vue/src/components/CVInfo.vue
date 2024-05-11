<script setup lang="ts">
import { ref, inject, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { uploadCv } from '../lib/fetch/cv.ts'
import { infoKey, updateKey } from '../lib/inject.ts'
import { useModalStore } from '../stores/modalStore.ts'
import { useValidStore } from '../stores/validStore.ts'
const modalStore = useModalStore()
const validStore = useValidStore()
const { showModel } = modalStore
const { cvState } = storeToRefs(validStore)
let info = inject(infoKey)
let update = inject(updateKey, () => ({}))
let src = computed(() =>
  info?.value['cv'] ? `/fastify/PDF/${info.value['cv']}.pdf` : '',
)
let embed = ref<HTMLEmbedElement>()
onMounted(() => {
  if (info?.value['cv'] && embed.value) {
    embed.value.src = src.value
    preview.value = true
  }
})
let fileInput = ref<HTMLInputElement>()
let newCv = ref<File>()
let wrong = ref(false)
let preview = ref(false)
const checkFile = () => {
  let file = fileInput.value?.files?.[0]
  if (embed.value && file && file.size <= 5_242_880) {
    wrong.value = false
    newCv.value = file
    embed.value.src = URL.createObjectURL(file)
    preview.value = true
  }
  else {
    newCv.value = undefined
    wrong.value = true
    preview.value = false
  }
}
let loading = ref(false)
const upload = async () => {
  if (newCv.value) {
    loading.value = true
    const formData = new FormData()
    formData.append('cv', newCv.value)
    const fileName = await uploadCv(formData)
    if (fileName) {
      showModel('简历上传成功')
      cvState.value = true
      update('cv', fileName)
    }
    else {
      showModel('请重试')
    }
    loading.value = false
  }
  else {
    wrong.value = true
  }
}
</script>

<template>
  <article>
    <input
      id="file"
      ref="fileInput"
      name="file"
      type="file"
      accept="application/pdf"
      @change="checkFile"
    >
    <small v-show="wrong">"简历PDF需小于5MB"</small>
    <embed
      v-show="preview"
      ref="embed"
      type="application/pdf"
      width="100%"
      height="600px"
    >
    <div class="button">
      <button
        :aria-busy="loading"
        @click.prevent="upload"
      >
        上传
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
