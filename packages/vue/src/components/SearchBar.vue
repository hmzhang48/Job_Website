<script setup lang="ts">
  import { ref } from 'vue'
  let keyword = ref('')
  const props = defineProps<{
    hrState: boolean
  }>()
  const emits = defineEmits<{
    search: [keyword: string]
    newJob: [keyword: string]
  }>()
</script>

<template>
  <article>
    <div :class="props.hrState ? 'grid' : 'search'">
      <form role="search">
        <input
          id="search"
          v-model.lazy="keyword"
          name="search"
          type="search"
          placeholder="搜索职位"
          required
        >
        <input
          type="submit"
          value="搜索"
          @click.prevent="emits('search', keyword)"
        >
      </form>
      <div class="button">
        <button
          v-if="props.hrState"
          @click.prevent="emits('newJob', keyword)"
        >
          发布新工作
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
  article {
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .grid {
    grid-template-columns: 1fr max-content;
    grid-gap: 20px;
  }
  form {
    margin-bottom: 0;
  }
</style>