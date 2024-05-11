<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getInfoBox, changeInfoBox } from '../lib/fetch/infobox.ts'
import type { infoItem } from '../lib/interface.ts'
import { useModalStore } from '../stores/modalStore.ts'
const modalStore = useModalStore()
const { showModel } = modalStore
let infoBox = ref<infoItem[]>([])
const limit = 2
let offset = 0
const getInfo = async () => {
  let infoList = await getInfoBox(offset, limit)
  if (infoList) {
    infoBox.value.push(...infoList)
    if (infoList.length < limit) {
      end.value = true
      offset += infoList.length
    }
    offset += limit
  }
}
onMounted(() => getInfo())
let end = ref(false)
const changeItem = async (no: number, action: string) => {
  let result = await changeInfoBox(no, action)
  if (result) {
    switch (action) {
      case 'remove': {
        infoBox.value = infoBox.value.filter(value => value.no !== no)
        break
      }
      case 'read': {
        let index = infoBox.value.findIndex(value => value.no === no)
        infoBox.value[index].read = true
        break
      }
    }
  }
  else {
    showModel('请重试')
  }
}
</script>

<template>
  <article ref="infoCard">
    <p><strong>信息箱</strong></p>
    <template
      v-for="info in infoBox"
      :key="info.no"
    >
      <div class="grid">
        <div>
          <del v-if="info.read">{{ info.info }}</del>
          <span v-else>{{ info.info }}</span>
          <br>
          <small>
            {{ info.time.slice(0,-5).replace("T", " ") }}
          </small>
        </div>
        <div class="button">
          <button @click="changeItem(info.no, info.read?'remove':'read')">
            {{ info.read?"删除":"已读" }}
          </button>
        </div>
      </div>
      <hr>
    </template>
    <div class="button">
      <button
        v-if="!end"
        @click="getInfo"
      >
        更多
      </button>
      <p v-else>
        没有更多了
      </p>
    </div>
  </article>
</template>

<style scoped lang="scss">
.grid {
  grid-template-columns: 4fr 1fr;
  gap: 20px;
}
.button {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
