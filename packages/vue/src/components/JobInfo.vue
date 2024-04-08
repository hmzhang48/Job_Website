<script setup lang="ts">
  import { ref, onMounted, computed } from "vue"
  import { finishJob, patchJob } from "../lib/fetch/jobinfo.ts"
  import { initProvince, initCity, initArea } from "../lib/help.ts"
  import type { jobItem, jobInfo } from "../lib/interface.ts"
  import { useModalStore } from "../stores/modalStore.ts"
  const modalStore = useModalStore()
  const { showModel } = modalStore
  const props = defineProps<{
    no: number | undefined
    job: jobItem | undefined
    corpID: string
  }>()
  const emits = defineEmits<{
    finishJob: []
    patchJob: [jobInfo?: jobInfo]
  }>()
  let invalid = ref<Record<string, boolean>>({})
  let position = ref("")
  const checkPosition = () => {
    invalid.value["position"] = position.value === "" ? true : false
  }
  let overview = ref("")
  const checkOverview = () => {
    invalid.value["overview"] = overview.value === "" ? true : false
  }
  let type = ref("")
  let salaryType = ref("千元/月")
  const checkType = () => {
    if (type.value === "") {
      invalid.value["type"] = true
    } else {
      if (type.value === "part-time") {
        salaryType.value = "元/小时"
      }
      if (type.value === "full-time") {
        salaryType.value = "千元/月"
      }
      invalid.value["type"] = false
    }
  }
  let minSalary = ref(0)
  let maxSalary = ref(0)
  const checkSalary = () => {
    invalid.value["salary"] =
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
    invalid.value["location"] = location.value === "area" ? true : false
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
            showModel("请重试")
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
          showModel("请重试")
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
      :aria-invalid="invalid['position']"
      v-model="position"
      @change="checkPosition" />
    <small v-show="invalid['position']">请填写职位名称</small>
    <label for="overview">职位介绍</label>
    <textarea
      id="overview"
      rows="5"
      placeholder="职位介绍"
      :aria-invalid="invalid['overview']"
      v-model="overview"
      @change="checkOverview">
    </textarea>
    <small v-show="invalid['overview']">请填写职位介绍</small>
    <fieldset>
      <legend>职位性质</legend>
      <input
        name="type"
        id="full-time"
        type="radio"
        value="full-time"
        :aria-invalid="invalid['type']"
        v-model="type"
        @change="checkType" />
      <label for="full-time">全职</label>
      <input
        name="type"
        id="part-time"
        type="radio"
        value="part-time"
        :aria-invalid="invalid['type']"
        v-model="type"
        @change="checkType" />
      <label for="part-time">兼职</label>
    </fieldset>
    <small v-show="invalid['type']">请选择职位性质</small>
    <label for="salary">{{ `薪资范围(${salaryType})` }}</label>
    <fieldset role="group">
      <input
        id="minSalary"
        type="number"
        :aria-invalid="invalid['salary']"
        v-model="minSalary"
        @change="checkSalary" />
      <input
        id="maxSalary"
        type="number"
        :aria-invalid="invalid['salary']"
        v-model="maxSalary"
        @change="checkSalary" />
    </fieldset>
    <small v-show="invalid['salary']">请填写薪资范围</small>
    <label for="location">工作地点</label>
    <fieldset role="group">
      <select
        id="province"
        :aria-invalid="invalid['location']"
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
        :aria-invalid="invalid['location']"
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
        :aria-invalid="invalid['location']"
        ref="areaSelect"
        v-model.lazy="location"
        @change="checkLocation">
        <option
          value="area"
          selected>
          区(县)
        </option>
      </select>
    </fieldset>
    <small v-show="invalid['location']">居住地未选择</small>
    <div class="button">
      <button @click.prevent="submit">完成</button>
    </div>
  </article>
</template>

<style scoped lang="scss">
  .button {
    display: flex;
    justify-content: center;
  }
</style>
