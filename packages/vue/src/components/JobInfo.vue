<script setup lang="ts">
  import { ref, onMounted, computed } from "vue"
  import { useModalStore } from "../stores/modalStore.js"
  import { finishJob, patchJob } from "../lib/connect.js"
  import type { jobItem, jobInfo } from "../lib/connect.js"
  import { initProvince, initCity, initArea } from "../lib/help.js"
  const modalStore = useModalStore()
  const props = defineProps<{
    no: number | undefined
    job: jobItem | undefined
    corpID: string
  }>()
  const emits = defineEmits<{
    finishJob: []
    patchJob: [jobInfo?: jobInfo]
  }>()
  const invalidKey = "aria-invalid"
  let invalid = ref<Record<string, boolean>>({})
  let position = ref("")
  const checkPosition = () => {
    invalid.value.position = position.value === "" ? true : false
  }
  let overview = ref("")
  const checkOverview = () => {
    invalid.value.overview = overview.value === "" ? true : false
  }
  let type = ref("")
  let salaryType = ref("千元/月")
  const checkType = () => {
    if (type.value === "") {
      invalid.value.type = true
    } else {
      if (type.value === "part-time") {
        salaryType.value = "元/小时"
      }
      if (type.value === "full-time") {
        salaryType.value = "千元/月"
      }
      invalid.value.type = false
    }
  }
  let minSalary = ref(0)
  let maxSalary = ref(0)
  const checkSalary = () => {
    invalid.value.salary =
      minSalary.value === 0 ||
      maxSalary.value === 0 ||
      minSalary.value > maxSalary.value
        ? true
        : false
  }
  let provinceSelect = ref<HTMLSelectElement>()
  let citySelect = ref<HTMLSelectElement>()
  let areaSelect = ref<HTMLSelectElement>()
  onMounted(() => {
    initProvince(provinceSelect.value)
    if (props.no && props.job) {
      position.value = props.job.position
      overview.value = props.job.overview
      minSalary.value = min.value
      maxSalary.value = max.value
      type.value = props.job.type
      let l = provinceSelect.value?.options.length
      if (l) {
        for (let index = 0; index < l; index++) {
          let option = provinceSelect.value?.options.item(index)
          if (option?.value === props.job.location.slice(0, 2)) {
            option.selected = true
          }
        }
      }
      initCity(provinceSelect.value, citySelect.value, areaSelect.value)
      l = citySelect.value?.options.length
      if (l) {
        for (let index = 0; index < l; index++) {
          let option = citySelect.value?.options.item(index)
          if (option?.value === props.job.location.slice(0, 4)) {
            option.selected = true
          }
        }
      }
      initArea(citySelect.value, areaSelect.value)
      l = areaSelect.value?.options.length
      if (l) {
        for (let index = 0; index < l; index++) {
          let option = areaSelect.value?.options.item(index)
          if (option?.value === props.job.location) {
            option.selected = true
          }
        }
      }
      location.value = props.job.location
      for (let key of keys) {
        invalid.value[key] = false
      }
    }
  })
  const addCity = () => {
    initCity(provinceSelect.value, citySelect.value, areaSelect.value)
    location.value = "area"
    checkLocation()
  }
  const addArea = () => {
    initArea(citySelect.value, areaSelect.value)
    location.value = "area"
    checkLocation()
  }
  let location = ref("area")
  const checkLocation = () => {
    invalid.value.location = location.value === "area" ? true : false
  }
  const keys = ["position", "overview", "type", "salary", "location"]
  const check = () => {
    checkType()
    let result = true
    for (let key of keys) {
      if (invalid.value[key] === undefined) {
        invalid.value[key] = true
      }
      if (invalid.value[key] && result) {
        result = false
      }
    }
    return result
  }
  let min = computed(() => {
    if (props.job) {
      let first = props.job.salary.split("~")[0]
      return Number(first)
    } else {
      return 0
    }
  })
  let max = computed(() => {
    if (props.job) {
      let second = props.job.salary.split("~")[1]
      if (second.endsWith("千元/月")) {
        second = second.split("千元/月")[0]
      } else if (second.endsWith("元/小时")) {
        second = second.split("元/小时")[0]
      }
      return Number(second)
    } else {
      return 0
    }
  })
  const submit = async () => {
    if (check()) {
      let jobInfo = Object.create(null)
      if (props.no) {
        if (position.value !== props.job?.position) {
          jobInfo.position = position.value
        }
        if (overview.value !== props.job?.overview) {
          jobInfo.overview = overview.value
        }
        if (type.value !== props.job?.type) {
          jobInfo.type = type.value
        }
        if (minSalary.value !== min.value || maxSalary.value !== max.value) {
          jobInfo.salary = `[${minSalary.value},${maxSalary.value}]`
        }
        if (location.value !== props.job?.location) {
          jobInfo.location = location.value
        }
        if (Object.keys(jobInfo).length > 0) {
          jobInfo.no = props.no
          jobInfo.corpID = props.corpID
          let result = await patchJob(jobInfo)
          delete jobInfo.no
          delete jobInfo.corpID
          if (result) {
            emits("patchJob", jobInfo)
          } else {
            modalStore.showModel("请重试")
          }
        } else {
          emits("patchJob")
        }
      } else {
        jobInfo.position = position.value
        jobInfo.overview = overview.value
        jobInfo.type = type.value
        jobInfo.salary = `[${minSalary.value},${maxSalary.value}]`
        jobInfo.location = location.value
        let result = await finishJob(jobInfo)
        if (result) {
          emits("finishJob")
        } else {
          modalStore.showModel("请重试")
        }
      }
    }
  }
</script>

<template>
  <article>
    <label for="position">职位名称</label>
    <input
      id="position"
      type="text"
      placeholder="职位名称"
      required
      :[invalidKey]="invalid.position"
      v-model="position"
      @change="checkPosition" />
    <p><small v-show="invalid.position">请填写职位名称</small></p>
    <label for="overview">职位介绍</label>
    <textarea
      id="overview"
      rows="3"
      placeholder="职位介绍"
      :[invalidKey]="invalid.overview"
      v-model="overview"
      @change="checkOverview">
    </textarea>
    <p><small v-show="invalid.overview">请填写职位介绍</small></p>
    <fieldset>
      <legend>职位性质</legend>
      <div class="grid">
        <label for="full-time">
          <input
            name="type"
            id="full-time"
            type="radio"
            value="full-time"
            :[invalidKey]="invalid.type"
            v-model="type"
            @change="checkType" />
          全职
        </label>
        <label for="part-time">
          <input
            name="type"
            id="part-time"
            type="radio"
            value="part-time"
            :[invalidKey]="invalid.type"
            v-model="type"
            @change="checkType" />
          兼职
        </label>
      </div>
      <p><small v-show="invalid.type">请选择职位性质</small></p>
    </fieldset>
    <fieldset>
      <legend>{{ `职位薪资(${salaryType})` }}</legend>
      <div class="grid">
        <label for="minSalary">
          <input
            id="minSalary"
            type="number"
            placeholder="最低薪资"
            :[invalidKey]="invalid.salary"
            v-model="minSalary"
            @change="checkSalary" />
        </label>
        <label for="maxSalary">
          <input
            id="maxSalary"
            type="number"
            placeholder="最高薪资"
            :[invalidKey]="invalid.salary"
            v-model="maxSalary"
            @change="checkSalary" />
        </label>
      </div>
      <p><small v-show="invalid.salary">请填写职位薪资</small></p>
    </fieldset>
    <fieldset>
      <legend>工作地点</legend>
      <div class="grid">
        <select
          id="province"
          :[invalidKey]="invalid.location"
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
          :[invalidKey]="invalid.location"
          ref="citySelect"
          @change="addArea">
          <option
            value="city"
            selected>
            市
          </option>
        </select>
        <select
          id="area"
          :[invalidKey]="invalid.location"
          ref="areaSelect"
          v-model.lazy="location"
          @change="checkLocation">
          <option
            value="area"
            selected>
            区(县)
          </option>
        </select>
      </div>
      <p><small v-show="invalid.location">居住地未选择</small></p>
    </fieldset>
    <button @click.prevent="submit">完成</button>
  </article>
</template>

<style scoped></style>
