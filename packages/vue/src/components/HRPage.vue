<script setup lang="ts">
  import { computed, ref, inject, watch } from "vue"
  import { storeToRefs } from "pinia"
  import { getJobList, deleteJob, receiveCV, removeCV } from "../lib/connect.ts"
  import {
    trueType,
    trueLocation,
    useObserver,
    corpKey,
    domain,
  } from "../lib/help.ts"
  import type { jobItem, jobInfo, cvItem } from "../lib/connect.ts"
  import SearchBar from "./SearchBar.vue"
  import JobInfo from "./JobInfo.vue"
  import JobList from "./JobList.vue"
  import CVList from "./CVList.vue"
  import CVReview from "./CVReview.vue"
  import { useUserStore } from "../stores/userStore.ts"
  import { useModalStore } from "../stores/modalStore.ts"
  const userStore = useUserStore()
  const modalStore = useModalStore()
  const { hrState } = storeToRefs(userStore)
  const { showModel } = modalStore
  let corp = inject(corpKey)
  let keyword = ref("")
  const getKeyword = (k: string) => {
    keyword.value = k
    newJob.value = false
    restart()
  }
  const limit = 2
  let offset = 0
  let end = ref(false)
  let tip = ref("加载中")
  watch(end, () => {
    tip.value = end.value ? "没有更多了" : "加载中"
  })
  let jobBox = ref<jobItem[]>([])
  const searchJobs = async () => {
    let c: Partial<Omit<jobInfo, "overview">> & {
      logo?: string
      offset?: number
    } = Object.create(null)
    if (keyword.value) {
      c.position = keyword.value
    }
    c.offset = offset
    const jobList = await getJobList(c)
    jobBox.value.push(...jobList)
    if (jobList.length < limit) {
      end.value = true
      offset += jobList.length
    } else {
      offset = offset + limit
    }
  }
  const restart = () => {
    offset = 0
    end.value = false
    jobBox.value.splice(0)
    searchJobs()
  }
  let observed = ref<HTMLParagraphElement>()
  useObserver(observed, searchJobs, end)
  let src = computed(() => {
    return corp?.value["logo"]
      ? `${domain}/fastify/image/${corp.value["logo"]}.png`
      : ""
  })
  let newJob = ref(false)
  const finishJob = () => {
    newJob.value = false
    end.value = false
  }
  let no = ref<number>()
  let job = ref<jobItem>()
  const updateJob = (value: number) => {
    newJob.value = true
    no.value = value
    job.value = jobBox.value.find((value) => value.no === no.value)
  }
  const patchJob = (jobInfo?: jobInfo) => {
    newJob.value = false
    if (jobInfo) {
      let index = jobBox.value.findIndex((value) => value.no === no.value)
      if (jobInfo.salary) {
        jobInfo.salary = jobInfo.salary.slice(1, -1).replace(",", "~")
        let type =
          jobInfo.type === undefined ? jobBox.value[index].type : jobInfo.type
        if (type === "full-time") {
          jobInfo.salary += "千元/月"
        } else if (type === "part-time") {
          jobInfo.salary += "元/小时"
        }
      }
      Object.assign(jobBox.value[index], jobInfo)
    }
  }
  const removeJob = async (no: number) => {
    let result = false
    if (corp) {
      result = await deleteJob(no, corp.value["corpID"])
    }
    if (result) {
      jobBox.value = jobBox.value.filter((value) => value.no !== no)
    } else {
      showModel("请重试")
    }
  }
  let cvList = ref<cvItem[]>([])
  let jobNo = ref(0)
  const getCV = async (value: number) => {
    let result = await receiveCV(value)
    if (result) {
      cvList.value = result
      jobNo.value = value
    } else {
      showModel("请重试")
    }
  }
  let hrMode = ref(0)
  let cv = ref("")
  const reviewCV = (value: string) => {
    hrMode.value = 1
    cv.value = value
  }
  const finishCV = async (
    action: string,
    cv: string,
    datetime?: string,
    location?: string,
  ) => {
    let result = false
    if (corp) {
      result = await removeCV(
        action,
        jobNo.value,
        cv,
        corp.value["corpName"],
        datetime,
        location,
      )
    }
    if (result) {
      cvList.value = cvList.value.filter((v) => v.cv !== cv)
      if (cvList.value.length === 0) {
        hrMode.value = 0
      }
    } else {
      showModel("请重试")
    }
  }
</script>

<template>
  <div v-show="!hrMode">
    <SearchBar
      :hrState="hrState"
      @search="getKeyword"
      @newJob="newJob = true" />
    <article>
      <header>
        <img :src="src" />
        <span>{{ corp?.["corpName"] }}</span>
      </header>
      <p>{{ corp?.["brief"] }}</p>
    </article>
    <JobInfo
      v-if="newJob"
      :no="no"
      :job="job"
      :corpID="corp?.['corpID'] ? corp['corpID'] : ''"
      @finishJob="finishJob"
      @patchJob="patchJob" />
    <article v-show="!newJob">
      <template
        v-for="job in jobBox"
        :key="job.no">
        <JobList
          :hrState="hrState"
          :corpname="job.corpInfo.corpName"
          :logo="job.corpInfo.logo"
          :position="job.position"
          :no="job.no"
          @updateJob="updateJob"
          @removeJob="removeJob"
          @getCV="getCV">
          <template #summary>
            <h1>{{ job.position }}</h1>
            <mark>{{ trueType(job.type) }}</mark>
            <mark>{{ job.salary }}</mark>
            <mark>{{ trueLocation(job.location) }}</mark>
          </template>
          <template #overview>
            {{ job.overview }}
          </template>
        </JobList>
      </template>
      <p ref="observed">{{ tip }}</p>
    </article>
  </div>
  <CVReview
    v-if="hrMode"
    :cv="cv"
    @finishCV="finishCV" />
  <CVList
    :cvList="cvList"
    @reviewCV="reviewCV" />
</template>

<style scoped></style>
