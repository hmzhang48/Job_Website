<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import HRInfo from './HRInfo.vue'
  import CorpInfo from './CorpInfo.vue'
  import { useModalStore } from '../stores/modalStore.ts'
  const modalStore = useModalStore()
  const { modalState, confirmState } = storeToRefs(modalStore)
  const { showModel } = modalStore
  watch(
    modalState,
    () => {
      if (confirmState.value) {
        show.value = false
        confirmState.value = false
      }
    }
  )
  const message = '该公司不在数据库中, 请先完善相关数据'
  let show = ref(true)
  let exist = ref(false)
  let id = ref({ hrId: '', corpId: '' })
</script>

<template>
  <section>
    <HRInfo
      v-show="show"
      v-model="id"
      :exist="exist"
      @modal="showModel(message, true)"
    />
    <CorpInfo
      v-if="!show"
      :hr-id="id.hrId"
      :corp-id="id.corpId"
      @exist="() => (exist = true)"
    />
  </section>
</template>

<style scoped lang="scss"></style>