<script setup lang="ts">
  import { computed } from "vue"
  import { domain } from "../lib/help.ts"
  const props = defineProps<{
    hrState: boolean
    corpname: string
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
  let src = computed(() => `${domain}/fastify/image/${props.logo}.png`)
  let buttonContent = computed(() => (props.hrState ? "接收简历" : "投递简历"))
</script>

<template>
  <details>
    <summary>
      <img
        :src="src"
        :data-tooltip="props.corpname"
        @click.prevent="hrState ? null : emits('searchCorp', props.logo)" />
      <slot name="summary"></slot>
    </summary>
    <p>
      <slot name="overview"></slot>
    </p>
    <p
      v-if="props.hrState"
      class="grid">
      <button @click.prevent="emits('updateJob', props.no)">修改</button>
      <button @click.prevent="emits('removeJob', props.no)">删除</button>
    </p>
    <button
      @click.prevent="
        hrState ? emits('getCV', props.no) : emits('sendCV', props.no)
      ">
      {{ buttonContent }}
    </button>
  </details>
</template>

<style scoped>
  img {
    width: 60px;
  }
</style>
