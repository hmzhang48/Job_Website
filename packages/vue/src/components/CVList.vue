<script setup lang="ts">
  import type { cvItem } from "../lib/interface.ts"
  const props = defineProps<{
    cvList: cvItem[]
  }>()
  const emits = defineEmits<{
    reviewCV: [cv: string]
  }>()
</script>

<template>
  <article>
    <p><strong>待处理简历</strong></p>
    <div v-if="cvList.length > 0">
      <ul
        v-for="cv in props.cvList"
        :key="cv.cv">
        <li>
          <a @click.prevent="emits('reviewCV', cv.cv)">{{ cv.name }}</a>
        </li>
      </ul>
    </div>
    <p v-else><small>暂无待处理简历</small></p>
  </article>
</template>

<style scoped lang="scss">
  article {
    position: sticky;
    top: 125px;
    z-index: 1;
  }
</style>
