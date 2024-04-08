<script setup lang="ts">
  import { ref, watch, onMounted } from "vue"
  import { initProvince, initCity, removeOption } from "../lib/help.ts"
  import type { jobInfo } from "../lib/interface.ts"
  const emits = defineEmits<{
    filter: [
      condition: Partial<Omit<jobInfo, "overview">> & {
        logo?: string
        offset?: number
      }
    ]
  }>()
  let type = ref("full-time")
  let salaryType = ref("千元/月")
  let salary = ref(5)
  let location = ref("local")
  let out = ref(false)
  watch(location, () => {
    out.value = location.value === "out" ? true : false
  })
  watch(type, () => {
    if (type.value === "part-time") {
      salaryType.value = "元/小时"
    }
    if (type.value === "full-time") {
      salaryType.value = "千元/月"
    }
  })
  let provinceSelect = ref<HTMLSelectElement>()
  let citySelect = ref<HTMLSelectElement>()
  let province = ref("province")
  let city = ref("city")
  onMounted(() => initProvince(provinceSelect.value))
  const addCity = () => {
    initCity(provinceSelect.value, citySelect.value)
  }
  const reset = () => {
    type.value = "full-time"
    salary.value = 5
    location.value = "local"
    province.value = "province"
    city.value = "city"
    removeOption(citySelect.value)
    out.value = false
  }
  const filter = () => {
    let condition: Partial<Omit<jobInfo, "overview" | "position">> =
      Object.create(null)
    condition.type = type.value
    if (location.value === "local") {
      condition.location = "0000"
    } else if (city.value !== "city") {
      condition.location = city.value
    }
    condition.salary = salary.value.toString()
    emits("filter", condition)
  }
</script>

<template>
  <article>
    <p><strong>筛选</strong></p>
    <fieldset>
      <legend>职位性质</legend>
      <input
        name="jobtype"
        id="full-time"
        type="radio"
        value="full-time"
        v-model="type" />
      <label for="full-time">全职</label>
      <input
        name="jobtype"
        id="part-time"
        type="radio"
        value="part-time"
        v-model="type" />
      <label for="part-time">兼职</label>
    </fieldset>
    <label for="salary">期望薪资</label>
    <input
      name="salary"
      id="salary"
      type="range"
      min="0"
      max="100"
      v-model.lazy="salary" />
    <small>{{ salary + " " + salaryType }}</small>
    <fieldset>
      <legend>工作地点</legend>
      <input
        name="location"
        id="local"
        type="radio"
        value="local"
        v-model="location" />
      <label for="local">本地</label>
      <input
        name="location"
        id="out"
        type="radio"
        value="out"
        v-model="location" />
      <label for="out">外地</label>
    </fieldset>
    <fieldset
      class="location"
      v-show="out">
      <select
        id="province"
        ref="provinceSelect"
        v-model.lazy="province"
        @change="addCity">
        <option
          value="province"
          selected>
          省(直辖市)
        </option>
      </select>
      <select
        id="city"
        ref="citySelect"
        v-model.lazy="city">
        <option
          value="city"
          selected>
          市
        </option>
      </select>
    </fieldset>
    <div class="button">
      <button @click.prevent="filter">完成</button>
      <button @click.prevent="reset">重置</button>
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
