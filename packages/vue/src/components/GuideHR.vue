<!-- @format -->

<script setup lang="ts">
  import HRInfo from "./HRInfo.vue"
  import CorpInfo from "./CorpInfo.vue"
  import { ref } from "vue"
  import { useModalStore } from "../stores/modalStore.js"
  const modalStore = useModalStore()
  let show = ref(true)
  modalStore.$subscribe((_, state) => {
    if (!state.modalState && state.confirmState) {
      show.value = !state.confirmState
      state.confirmState = false
    }
  })
  let exist = ref(false)
  let hrid = ref("")
  let corpid = ref("")
  const corpInfo = (name: string, id: string) => {
    hrid.value = name
    corpid.value = id
    modalStore.showModel("该公司不在数据库中, 请先完善相关数据", true)
  }
  const hrInfo = () => {
    exist.value = true
  }
  const emits = defineEmits<{
    guide: []
  }>()
</script>

<template>
  <HRInfo
    v-show="show"
    :exist="exist"
    @corpInfo="corpInfo"
    @hrInfo="emits('guide')" />
  <CorpInfo v-if="!show" :hrid="hrid" :corpid="corpid" @corpInfo="hrInfo" />
</template>

<style scoped></style>
