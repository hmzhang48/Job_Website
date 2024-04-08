<script setup lang="ts">
  import { computed } from "vue"
  const props = defineProps<{
    hrState: boolean
    corpName: string
    logo: string
    position: string
    no: number
  }>()
  const emits = defineEmits<{
    searchCorp: [logo: string]
    updateJob: [no: number]
    removeJob: [no: number]
    sendCV: [no: number]
    getCV: [no: number]
  }>()
  let src = computed(() => `/fastify/image/${props.logo}.png`)
</script>

<template>
  <article>
    <details>
      <summary>
        <img
          :src="src"
          align="left"
          @click.prevent="hrState ? null : emits('searchCorp', props.logo)" />
        <slot name="summary"></slot>
      </summary>
      <p>
        <slot name="overview"></slot>
      </p>
      <div class="button">
        <button
          class="outline"
          v-if="props.hrState"
          @click.prevent="emits('updateJob', props.no)">
          修改
        </button>
        <button
          class="outline"
          v-if="props.hrState"
          @click.prevent="emits('removeJob', props.no)">
          删除
        </button>
        <button
          @click.prevent="
            hrState ? emits('getCV', props.no) : emits('sendCV', props.no)
          ">
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
  .button {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
</style>
