<script setup lang="ts">
import { ref, inject } from 'vue'
import { hrListKey } from '../lib/inject.ts'
const url = import.meta.env.PROD ? `https://${import.meta.env.VITE_AZURE_STORAGE_ACCOUNT}.blob.core.windows.net` : ''
let hrs = inject(hrListKey)
let verify = ref(false)
</script>

<template>
  <div class="grid">
    <aside>
      <article>
        <nav>
          <ul>
            <li
              :class="verify ? 'normal':'select'"
              @click.prevent="verify = false"
            >
              HR管理
            </li>
            <li :class="verify ? 'select' : 'normal'">
              企业认证
            </li>
          </ul>
        </nav>
      </article>
    </aside>
    <article v-if="!verify">
      <p><strong>企业HR列表</strong></p>
      <div v-if="hrs?.length">
        <template
          v-for="hr in hrs"
          :key="hr.hrId"
        >
          <div class="list">
            <img :src="`${url}/png/${hr.avatar}.png`">
            <div>
              <span>姓名：{{ hr.name }}</span>
              <br>
              <span>工号：{{ hr.hrId }}</span>
            </div>
          </div>
          <hr>
        </template>
      </div>
      <p v-else>
        暂无其他HR
      </p>
    </article>
  </div>
</template>

<style scoped lang="scss">
.grid {
  grid-template-columns: max-content 1fr;
  gap: 20px;
}
.normal {
  cursor: pointer;
  &:hover {
    background-color: rgb(239, 241, 244);
  }
}
.select {
  background-color: rgb(239, 241, 244);
}
.list {
  display: flex;
  align-items: center;
  gap: 20px;
}
img {
  height: 48px;
}
</style>
