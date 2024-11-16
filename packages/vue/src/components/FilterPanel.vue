<script setup lang="ts">
  import { ref, watch, onMounted, useTemplateRef } from 'vue'
  import { initProvince, initCity, removeOption } from '../lib/help.ts'
  import type { jobInfo } from '../lib/interface.ts'
  const emits = defineEmits<{
    filter: [condition: Partial<Omit<jobInfo, 'overview'>>]
    reset: []
  }>()
  let type = ref('full-time')
  let salaryType = ref('千元/月')
  let min = ref(5)
  let max = ref(100)
  let salary = ref(5)
  let location = ref('local')
  let out = ref(false)
  watch(location, () => out.value = (location.value === 'out'))
  watch(
    type,
    () => {
      switch (type.value) {
        case 'part-time': {
          salaryType.value = '元/小时'
          min.value = 30
          max.value = 600
          salary.value = min.value
          break
        }
        case 'full-time': {
          salaryType.value = '千元/月'
          min.value = 5
          max.value = 100
          salary.value = min.value
          break
        }
      }
    }
  )
  let provinceSelect = useTemplateRef('provinceSelect')
  let citySelect = useTemplateRef('citySelect')
  let province = ref('province')
  let city = ref('city')
  onMounted(() => initProvince(provinceSelect.value))
  const addCity = () => initCity(provinceSelect.value, citySelect.value)
  const reset = () => {
    type.value = 'full-time'
    salary.value = 5
    location.value = 'local'
    province.value = 'province'
    city.value = 'city'
    removeOption(citySelect.value)
    out.value = false
    emits('reset')
  }
  const filter = () => {
    let condition = Object.create(null) as Partial<Omit<jobInfo, 'overview' | 'position'>>
    condition.type = type.value
    if (location.value === 'local')
      condition.location = '0000'
    if (city.value !== 'city')
      condition.location = city.value
    condition.salary = salary.value.toString()
    emits('filter', condition)
  }
</script>

<template>
  <article>
    <p><strong>筛选</strong></p>
    <fieldset>
      <legend>职位性质</legend>
      <input
        id="full-time"
        v-model="type"
        name="jobtype"
        type="radio"
        value="full-time"
      >
      <label for="full-time">全职</label>
      <input
        id="part-time"
        v-model="type"
        name="jobtype"
        type="radio"
        value="part-time"
      >
      <label for="part-time">兼职</label>
    </fieldset>
    <label for="salary">期望薪资</label>
    <input
      id="salary"
      v-model.lazy="salary"
      name="salary"
      type="range"
      :min="min"
      :max="max"
    >
    <small>{{ salary + " " + salaryType }}</small>
    <fieldset>
      <legend>工作地点</legend>
      <input
        id="local"
        v-model="location"
        name="location"
        type="radio"
        value="local"
      >
      <label for="local">本地</label>
      <input
        id="out"
        v-model="location"
        name="location"
        type="radio"
        value="out"
      >
      <label for="out">外地</label>
    </fieldset>
    <fieldset
      v-show="out"
      class="location"
    >
      <select
        id="province"
        ref="provinceSelect"
        v-model.lazy="province"
        @change="addCity"
      >
        <option
          value="province"
          selected
        >
          省(直辖市)
        </option>
      </select>
      <select
        id="city"
        ref="citySelect"
        v-model.lazy="city"
      >
        <option
          value="city"
          selected
        >
          市
        </option>
      </select>
    </fieldset>
    <div class="button">
      <button @click.prevent="filter">
        完成
      </button>
      <button @click.prevent="reset">
        重置
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
  article {
    position: sticky;
    top: 125px;
    z-index: 1;
  }
  small {
    text-align: center;
  }
  .location {
    margin-bottom: 0;
  }
  .button {
    display: flex;
    justify-content: center;
    gap: 10px;
  }
</style>