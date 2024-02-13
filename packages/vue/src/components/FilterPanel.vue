<script setup lang="ts">
  import { ref, watch, onMounted } from "vue"
  import { initProvince, initCity } from "../lib/help.ts"
  import type { jobInfo } from "../lib/connect.ts"
  const emits = defineEmits<{
    filter: [
      condition: Partial<Omit<jobInfo, "overview">> & {
        logo?: string
        offset?: number
      },
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
  let city = ref("city")
  onMounted(() => {
    initProvince(provinceSelect.value)
  })
  const addCity = () => {
    initCity(provinceSelect.value, citySelect.value)
  }
  const reset = () => {
    type.value = "full-time"
    salary.value = 5
    location.value = "local"
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
    <h1>筛选</h1>
    <fieldset>
      <legend>职位性质</legend>
      <div class=".grid">
        <label for="full-time">
          <input
            name="jobtype"
            id="full-time"
            type="radio"
            value="full-time"
            v-model="type" />
          全职
        </label>
        <label for="part-time">
          <input
            name="jobtype"
            id="part-time"
            type="radio"
            value="part-time"
            v-model="type" />
          兼职
        </label>
      </div>
    </fieldset>
    <label for="salary">{{ `期望薪资(${salaryType})` }}</label>
    <input
      name="salary"
      id="salary"
      type="range"
      min="0"
      max="100"
      v-model.lazy="salary" />
    <small>{{ salary }}</small>
    <fieldset>
      <legend>工作地点</legend>
      <div class="grid">
        <label for="local">
          <input
            name="location"
            id="local"
            type="radio"
            value="local"
            v-model="location" />
          本地
        </label>
        <label for="out">
          <input
            name="location"
            id="out"
            type="radio"
            value="out"
            v-model="location" />
          外地
        </label>
      </div>
    </fieldset>
    <fieldset v-show="out">
      <legend>请选择工作地点</legend>
      <div class="grid">
        <select
          id="province"
          ref="provinceSelect"
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
      </div>
    </fieldset>
    <span
      role="button"
      @click.prevent="filter">
      完成
    </span>
    <span
      role="button"
      @click.prevent="reset">
      重置
    </span>
  </article>
</template>

<style scoped>
  article {
    position: sticky;
    top: 0;
    z-index: 1;
  }
</style>
