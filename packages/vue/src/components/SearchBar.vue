<script setup lang="ts">
  import { ref } from "vue"
  let keyword = ref("")
  const props = defineProps<{
    hrState: boolean
  }>()
  const emits = defineEmits<{
    search: [keyword: string]
    newJob: [keyword: string]
  }>()
</script>

<template>
  <div class="grid">
    <input
      name="search"
      id="search"
      type="search"
      placeholder="搜索"
      required
      v-model.lazy="keyword" />
    <button @click.prevent="emits('search', keyword)">搜索</button>
    <button
      v-if="props.hrState"
      @click.prevent="emits('newJob', keyword)">
      发布新工作
    </button>
  </div>
</template>

<style scoped>
  div {
    position: sticky;
    top: 0;
    z-index: 1;
  }
</style>
