<!-- @format -->

<script setup lang="ts">
  import { ref, watch, onMounted } from "vue"
  import { initProvince, initCity } from "../lib/help.js"
  import type { condition } from "../lib/connect.js"
  let type = ref("full-time")
  let salaryType = ref("千元/月")
  let salary = ref(5)
  let location = ref("local")
  let out = ref(false)
  watch(location, () => {
    if (location.value === "out") {
      out.value = true
    } else {
      out.value = false
    }
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
  const emits = defineEmits<{
    filter: [condition: condition]
  }>()
  const filter = () => {
    let condition: condition = Object.create(null)
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
            v-model="type"
            type="radio"
            name="jobtype"
            id="full-time"
            value="full-time" />
          全职
        </label>
        <label for="part-time">
          <input
            v-model="type"
            type="radio"
            name="jobtype"
            id="part-time"
            value="part-time" />
          兼职
        </label>
      </div>
    </fieldset>
    <label for="salary">{{ `期望薪资(${salaryType})` }}</label>
    <input
      v-model.lazy="salary"
      type="range"
      min="0"
      max="100"
      id="salary"
      name="salary" />
    <small>{{ salary }}</small>
    <fieldset>
      <legend>工作地点</legend>
      <div class="grid">
        <label for="local">
          <input
            v-model="location"
            type="radio"
            name="location"
            id="local"
            value="local" />
          本地
        </label>
        <label for="out">
          <input
            v-model="location"
            type="radio"
            name="location"
            id="out"
            value="out" />
          外地
        </label>
      </div>
    </fieldset>
    <fieldset v-show="out">
      <legend>请选择工作地点</legend>
      <div class="grid">
        <select id="province" ref="provinceSelect" @change="addCity">
          <option value="province" selected>省(直辖市)</option>
        </select>
        <select v-model.lazy="city" id="city" ref="citySelect">
          <option value="city" selected>市</option>
        </select>
      </div>
    </fieldset>
    <span role="button" @click.prevent="filter">完成</span>
    <span role="button" @click.prevent="reset">重置</span>
  </article>
</template>

<style scoped>
  article {
    position: sticky;
    top: 0;
    z-index: 1;
  }
</style>
