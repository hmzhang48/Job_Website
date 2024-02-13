<script setup lang="ts">
  import type { cvItem } from "../lib/connect.ts"
  const props = defineProps<{
    cvList: cvItem[]
  }>()
  const emits = defineEmits<{
    reviewCV: [cv: string]
  }>()
</script>

<template>
  <article>
    <h1>待处理简历</h1>
    <div v-if="cvList.length > 0">
      <ul
        v-for="cv in props.cvList"
        :key="cv.cv">
        <li>
          <a @click.prevent="emits('reviewCV', cv.cv)">{{ cv.name }}</a>
        </li>
      </ul>
    </div>
    <p v-else>暂无待处理简历</p>
  </article>
</template>

<style scoped>
  article {
    position: sticky;
    top: 0;
    z-index: 1;
  }
</style>
