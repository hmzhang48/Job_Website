<script setup lang="ts">
  import { ref, onMounted } from "vue"
  import { useModalStore } from "../stores/modalStore.js"
  import { getInfoBox, changeInfoBox } from "../lib/connect.js"
  import type { infoItem } from "../lib/connect.js"
  const modalStore = useModalStore()
  const { showModel } = modalStore
  let infoBox = ref<infoItem[]>([])
  const limit = 2
  let offset = 0
  const getInfo = async () => {
    let infoList = await getInfoBox(offset)
    infoBox.value.push(...infoList)
    if (infoList.length < limit) {
      end.value = true
      offset += infoList.length
    }
    offset += limit
  }
  onMounted(() => {
    getInfo()
  })
  let end = ref(false)
  const changeItem = async (no: number, action: string) => {
    let result = await changeInfoBox(no, action)
    if (result) {
      if (action === "remove") {
        infoBox.value = infoBox.value.filter((value) => {
          value.no !== no
        })
      }
      if (action === "read") {
        let index = infoBox.value.findIndex((value) => value.no === no)
        infoBox.value[index].read = true
      }
    } else {
      showModel("请重试")
    }
  }
</script>

<template>
  <article ref="infoCard">
    <h1>信息箱</h1>
    <table>
      <tbody>
        <template
          v-for="info in infoBox"
          :key="info.no">
          <tr v-if="info.read">
            <td>
              <small>{{ info.info }}</small>
            </td>
            <td>
              <small>{{ info.time }}</small>
            </td>
            <td>
              <button @click="changeItem(info.no, 'remove')">删除</button>
            </td>
          </tr>
          <tr v-else>
            <td>
              <strong>{{ info.info }}</strong>
            </td>
            <td>
              <strong>{{ info.time }}</strong>
            </td>
            <td><button @click="changeItem(info.no, 'read')">已读</button></td>
          </tr>
        </template>
      </tbody>
    </table>
    <button
      v-if="!end"
      @click="getInfo">
      更多
    </button>
    <p v-else>没有更多了</p>
  </article>
</template>

<style scoped></style>
