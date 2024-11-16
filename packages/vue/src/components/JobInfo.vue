<script setup lang="ts">
  import { ref, onMounted, computed, useTemplateRef } from 'vue'
  import { finishJob, patchJob } from '../lib/fetch/jobinfo.ts'
  import { initProvince, initCity, initArea } from '../lib/help.ts'
  import type { jobItem, jobInfo } from '../lib/interface.ts'
  import { useModalStore } from '../stores/modalStore.ts'
  const modalStore = useModalStore()
  const { showModel } = modalStore
  const props = defineProps<{
    no: number | undefined
    job: jobItem | undefined
    corpId: string
  }>()
  const emits = defineEmits<{
    finishJob: []
    patchJob: [jobInfo?: Partial<jobInfo>]
  }>()
  let invalid = ref(Object.create(null) as Record<string, boolean>)
  let position = ref('')
  const checkPosition = () => invalid.value['position'] = (position.value === '')
  let overview = ref('')
  const checkOverview = () => {
    invalid.value['overview'] = (overview.value === '')
    if (!invalid.value['overview'])
      overview.value = overview.value.split('\n')
        .map(p => p.trim())
        .join('\n')
  }
  let type = ref('')
  let salaryType = ref('千元/月')
  const checkType = () => {
    invalid.value['type'] = (type.value === '')
    switch (type.value) {
      case 'part-time': {
        salaryType.value = '元/小时'
        break
      }
      case 'full-time': {
        salaryType.value = '千元/月'
        break
      }
    }
  }
  let minSalary = ref(0)
  let maxSalary = ref(0)
  const checkSalary = () => invalid.value['salary'] = (
    minSalary.value === 0 || maxSalary.value === 0 || minSalary.value > maxSalary.value
  )
  let provinceSelect = useTemplateRef('provinceSelect')
  let citySelect = useTemplateRef('citySelect')
  let areaSelect = useTemplateRef('areaSelect')
  onMounted(
    () => {
      initProvince(provinceSelect.value)
      if (props.no && props.job) {
        position.value = props.job.position
        overview.value = props.job.overview
        minSalary.value = min.value
        maxSalary.value = max.value
        type.value = props.job.type
        let l = provinceSelect.value?.options.length
        if (l)
          for (let index = 0; index < l; index++) {
            let option = provinceSelect.value?.options.item(index)
            if (option?.value === props.job.location.slice(0, 2))
              option.selected = true
          }
        initCity(provinceSelect.value, citySelect.value, areaSelect.value)
        l = citySelect.value?.options.length
        if (l)
          for (let index = 0; index < l; index++) {
            let option = citySelect.value?.options.item(index)
            if (option?.value === props.job.location.slice(0, 4))
              option.selected = true
          }
        initArea(citySelect.value, areaSelect.value)
        l = areaSelect.value?.options.length
        if (l)
          for (let index = 0; index < l; index++) {
            let option = areaSelect.value?.options.item(index)
            if (option?.value === props.job.location)
              option.selected = true
          }
        location.value = props.job.location
        for (let key of keys)
          invalid.value[key] = false
      }
    }
  )
  const addCity = () => {
    initCity(provinceSelect.value, citySelect.value, areaSelect.value)
    location.value = 'area'
    checkLocation()
  }
  const addArea = () => {
    initArea(citySelect.value, areaSelect.value)
    location.value = 'area'
    checkLocation()
  }
  let location = ref('area')
  const checkLocation = () => invalid.value['location'] = (location.value === 'area')
  const keys = ['position', 'overview', 'type', 'salary', 'location']
  const check = () => {
    for (let key of keys) {
      if (invalid.value[key] === undefined)
        invalid.value[key] = true
      if (invalid.value[key])
        return false
    }
    return true
  }
  let min = computed(() => props.job ? Number(props.job.salary.match(/\d+/g)?.[0]) : 0)
  let max = computed(() => props.job ? Number(props.job.salary.match(/\d+/g)?.[1]) : 0)
  let loading = ref(false)
  const submit = async () => {
    if (check()) {
      loading.value = true
      if (props.no) {
        const jobInfo = Object.create(null) as Partial<jobInfo>
        if (position.value !== props.job?.position)
          jobInfo.position = position.value
        if (overview.value !== props.job?.overview)
          jobInfo.overview = overview.value
        if (type.value !== props.job?.type)
          jobInfo.type = type.value
        if (minSalary.value !== min.value || maxSalary.value !== max.value)
          jobInfo.salary = `[${minSalary.value},${maxSalary.value}]`
        if (location.value !== props.job?.location)
          jobInfo.location = location.value
        if (Object.keys(jobInfo).length > 0) {
          const result = await patchJob(jobInfo, props.no, props.corpId)
          if (result)
            emits('patchJob', jobInfo)
          else
            showModel('请重试')
        }
        else
          emits('patchJob')
      }
      else {
        const result = await finishJob({
          position: position.value,
          overview: overview.value,
          type: type.value,
          salary: `[${minSalary.value},${maxSalary.value}]`,
          location: location.value,
        })
        if (result)
          emits('finishJob')
        else
          showModel('请重试')
      }
      loading.value = false
    }
  }
</script>

<template>
  <article>
    <label for="position">职位名称</label>
    <input
      id="position"
      v-model="position"
      type="text"
      placeholder="职位名称"
      required
      :aria-invalid="invalid['position']"
      @change="checkPosition"
    >
    <small v-show="invalid['position']">请填写职位名称</small>
    <label for="overview">职位介绍</label>
    <textarea
      id="overview"
      v-model="overview"
      rows="5"
      placeholder="职位介绍"
      :aria-invalid="invalid['overview']"
      @change="checkOverview"
    />
    <small v-show="invalid['overview']">请填写职位介绍</small>
    <fieldset>
      <legend>职位性质</legend>
      <input
        id="full-time"
        v-model="type"
        name="type"
        type="radio"
        value="full-time"
        :aria-invalid="invalid['type']"
        @change="checkType"
      >
      <label for="full-time">全职</label>
      <input
        id="part-time"
        v-model="type"
        name="type"
        type="radio"
        value="part-time"
        :aria-invalid="invalid['type']"
        @change="checkType"
      >
      <label for="part-time">兼职</label>
    </fieldset>
    <small v-show="invalid['type']">请选择职位性质</small>
    <label for="salary">{{ `薪资范围(${salaryType})` }}</label>
    <fieldset role="group">
      <input
        id="minSalary"
        v-model="minSalary"
        type="number"
        :aria-invalid="invalid['salary']"
        @change="checkSalary"
      >
      <input
        id="maxSalary"
        v-model="maxSalary"
        type="number"
        :aria-invalid="invalid['salary']"
        @change="checkSalary"
      >
    </fieldset>
    <small v-show="invalid['salary']">请填写薪资范围</small>
    <label for="location">工作地点</label>
    <fieldset role="group">
      <select
        id="province"
        ref="provinceSelect"
        :aria-invalid="invalid['location']"
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
        :aria-invalid="invalid['location']"
        @change="addArea"
      >
        <option
          value="city"
          selected
        >
          市
        </option>
      </select>
      <select
        id="area"
        ref="areaSelect"
        v-model.lazy="location"
        :aria-invalid="invalid['location']"
        @change="checkLocation"
      >
        <option
          value="area"
          selected
        >
          区(县)
        </option>
      </select>
    </fieldset>
    <small v-show="invalid['location']">居住地未选择</small>
    <div class="button">
      <button
        :aria-busy="loading"
        @click.prevent="submit"
      >
        完成
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
  .button {
    display: flex;
    justify-content: center;
  }
</style>