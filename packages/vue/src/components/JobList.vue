<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  hrState: boolean
  corpName: string
  logo: string
  no: number
}>()
const emits = defineEmits<{
  searchCorp: [logo: string]
  updateJob: [no: number]
  removeJob: [no: number]
  sendCv: [no: number]
  getCv: [no: number]
}>()
let src = computed(() => `/image/${props.logo}.png`)
</script>

<template>
  <article>
    <details>
      <summary>
        <img
          :src="src"
          :title="props.corpName"
          align="left"
          @click.prevent="hrState ? null : emits('searchCorp', props.logo)"
        >
        <slot name="summary" />
      </summary>
      <pre>
        <slot name="overview" />
      </pre>
      <div class="button">
        <button
          v-if="props.hrState"
          class="outline"
          @click.prevent="emits('updateJob', props.no)"
        >
          修改
        </button>
        <button
          v-if="props.hrState"
          class="outline"
          @click.prevent="emits('removeJob', props.no)"
        >
          删除
        </button>
        <button
          @click.prevent="
            hrState ? emits('getCv', props.no) : emits('sendCv', props.no)
          "
        >
          {{ props.hrState ? "接收简历" : "投递简历" }}
        </button>
      </div>
    </details>
  </article>
</template>

<style scoped lang="scss">
img {
  width: 24px;
  margin: 0 10px;
}
pre {
  font-size: 0.9rem;
  white-space: pre-line;
  padding: 1rem;
  border-radius: 0.5rem;
}
.button {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
