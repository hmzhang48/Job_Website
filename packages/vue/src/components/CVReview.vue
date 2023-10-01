<!-- @format -->

<script setup lang="ts">
  import { ref, computed, onMounted } from "vue"
  import { domain } from "../lib/help"
  const props = defineProps<{
    cv: string
  }>()
  let embed = ref<HTMLEmbedElement>()
  let src = computed(() => `${domain}/fastify/pdf/${props.cv}.pdf`)
  onMounted(() => {
    if (embed.value) {
      embed.value.src = src.value
    }
  })
  const emits = defineEmits<{
    finishCV: [action: string, cv: string, datetime?: string, location?: string]
  }>()
  let date = ref("")
  let time = ref("")
  let location = ref("")
  let invalid = ref<Record<string, boolean>>({})
  const check = () => {
    let result = true
    if (date.value) {
      invalid.value.date = false
    } else {
      invalid.value.date = true
      result = false
    }
    if (time.value) {
      invalid.value.time = false
    } else {
      invalid.value.time = true
      result = false
    }
    if (location.value) {
      invalid.value.location = false
    } else {
      invalid.value.location = true
      result = false
    }
    return result
  }
  const sendLetter = (action: string) => {
    if (action === "welcome" && check()) {
      emits(
        "finishCV",
        action,
        props.cv,
        `${date.value}-${time.value}`,
        location.value
      )
    }
    if (action === "refuse") {
      emits("finishCV", action, props.cv)
    }
  }
</script>

<template>
  <article>
    <div class="grid">
      <label for="datetime">
        面试时间
        <input
          v-model.lazy="date"
          type="date"
          id="date"
          :aria-invalid="invalid.date"
          required />
        <input
          v-model.lazy="time"
          type="time"
          id="time"
          :aria-invalid="invalid.time" />
        <small v-show="invalid.date || invalid.time">请输入面试时间</small>
      </label>
      <label for="location">
        面试地点
        <input
          v-model.lazy="location"
          type="text"
          id="location"
          placeholder="请输入面试地点"
          :aria-invalid="invalid.location"
          required />
        <small v-show="invalid.location">请输入面试地点</small>
      </label>
      <button @click.prevent="sendLetter('welcome')">发送面试邀请</button>
      <button @click.prevent="sendLetter('refuse')">发送拒绝信</button>
    </div>
  </article>
  <article>
    <embed type="application/pdf" width="100%" height="600px" ref="embed" />
  </article>
</template>

<style scoped></style>
