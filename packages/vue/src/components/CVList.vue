<script setup lang="ts">
import type { cvItem } from '../lib/interface.ts'
const props = defineProps<{
  cvList: cvItem[]
}>()
const emits = defineEmits<{
  reviewCv: [cv: string]
}>()
</script>

<template>
  <article>
    <p><strong>待处理简历</strong></p>
    <div v-if="cvList.length > 0">
      <template
        v-for="item in props.cvList"
        :key="item.cv"
      >
        <a @click.prevent="emits('reviewCv', item.cv)">{{ item.name }}</a>
      </template>
    </div>
    <p v-else>
      <small>暂无待处理简历</small>
    </p>
  </article>
</template>

<style scoped lang="scss">
article {
  position: sticky;
  top: 125px;
  z-index: 1;
}
a {
  cursor: pointer;
}
</style>
