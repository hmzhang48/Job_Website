<script setup lang="ts">
  import { ref, computed, onMounted, useTemplateRef } from 'vue'
  const props = defineProps<{
    cv: string
  }>()
  const emits = defineEmits<{
    finishCv: [action: string, cv: string, datetime?: string, location?: string]
  }>()
  let embed = useTemplateRef('embed')
  const env = import.meta.env
  const url = env.PROD ? `https://${env.VITE_AZURE_STORAGE_ACCOUNT}.blob.core.windows.net` : ''
  let src = computed(() => `${url}/pdf/${props.cv}.pdf`)
  onMounted(
    () => {
      if (embed.value) embed.value.src = src.value
    }
  )
  let date = ref('')
  let time = ref('')
  let location = ref('')
  let invalid = ref(Object.create(null) as Record<string, boolean>)
  const check = () => {
    invalid.value['date'] = !(date.value)
    invalid.value['time'] = !(time.value)
    invalid.value['location'] = !(location.value)
    return !!(date.value) && !!(time.value) && !!(location.value)
  }
  const sendLetter = (action: string) => {
    switch (action) {
      case 'welcome': {
        if (check())
          emits(
            'finishCv', action, props.cv,
            `${date.value}-${time.value}`, location.value,
          )
        break
      }
      case 'refuse': {
        emits('finishCv', action, props.cv)
        break
      }
    }
  }
</script>

<template>
  <article>
    <div>
      <label for="datetime">面试时间</label>
      <fieldset role="group">
        <input
          id="date"
          v-model.lazy="date"
          type="date"
          required
          :aria-invalid="invalid['date']"
        >
        <input
          id="time"
          v-model.lazy="time"
          type="time"
          :aria-invalid="invalid['time']"
        >
      </fieldset>
      <small v-show="invalid['date'] || invalid['time']">
        请输入面试时间
      </small>
      <label for="location">面试地点</label>
      <input
        id="location"
        v-model.lazy="location"
        type="text"
        placeholder="请输入面试地点"
        required
        :aria-invalid="invalid['location']"
      >
      <small v-show="invalid['location']">请输入面试地点</small>
    </div>
    <div class="button">
      <button @click.prevent="sendLetter('welcome')">
        发送面试邀请
      </button>
      <button @click.prevent="sendLetter('refuse')">
        发送拒绝信
      </button>
    </div>
  </article>
  <article>
    <embed
      ref="embed"
      type="application/pdf"
      width="100%"
      height="600px"
    >
  </article>
</template>

<style scoped lang="scss">
  .button {
    display: flex;
    justify-content: right;
    gap: 20px;
  }
</style>