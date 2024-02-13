<script setup lang="ts">
  import { ref, watch } from "vue"
  import { storeToRefs } from "pinia"
  import HRInfo from "./HRInfo.vue"
  import CorpInfo from "./CorpInfo.vue"
  import { useModalStore } from "../stores/modalStore.ts"
  const modalStore = useModalStore()
  const { modalState, confirmState } = storeToRefs(modalStore)
  const { showModel } = modalStore
  watch(modalState, () => {
    if (confirmState.value) {
      show.value = false
      confirmState.value = false
    }
  })
  const emits = defineEmits<{
    guide: []
  }>()
  let show = ref(true)
  let exist = ref(false)
  let hrID = ref("")
  let corpID = ref("")
  const corpInfo = (hr_id: string, corp_id: string) => {
    hrID.value = hr_id
    corpID.value = corp_id
    showModel("该公司不在数据库中, 请先完善相关数据", true)
  }
  const hrInfo = () => {
    exist.value = true
  }
</script>

<template>
  <HRInfo
    v-show="show"
    :exist="exist"
    @corpInfo="corpInfo"
    @hrInfo="emits('guide')" />
  <CorpInfo
    v-if="!show"
    :hrID="hrID"
    :corpID="corpID"
    @corpInfo="hrInfo" />
</template>

<style scoped></style>
