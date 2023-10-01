<!-- @format -->

<script setup lang="ts">
  import { computed, ref, inject, watch } from "vue"
  import { useUserStore } from "../stores/userStore.js"
  import { useModalStore } from "../stores/modalStore.js"
  import SearchBar from "./SearchBar.vue"
  import JobInfo from "./JobInfo.vue"
  import JobList from "./JobList.vue"
  import CVList from "./CVList.vue"
  import CVReview from "./CVReview.vue"
  import { getJobList, deleteJob, receiveCV, removeCV } from "../lib/connect.js"
  import type { condition, jobItem, jobInfo, cvItem } from "../lib/connect.js"
  import {
    trueType,
    trueLocation,
    useObserver,
    corpKey,
    domain
  } from "../lib/help.js"
  const userStore = useUserStore()
  const modalStore = useModalStore()
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
    if (end.value) {
      tip.value = "没有更多了"
    } else {
      tip.value = "加载中"
    }
  })
  let jobBox = ref<jobItem[]>([])
  const searchJobs = async () => {
    let c: Partial<condition> = Object.create(null)
    if (keyword.value) {
      c.position = keyword.value
    }
    c.offset = offset.toString()
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
    if (corp?.value.logo) {
      return `${domain}/fastify/image/${corp.value.logo}.png`
    } else {
      return ""
    }
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
      let i = jobBox.value.findIndex((value) => value.no === no.value)
      if (jobInfo.salary) {
        jobInfo.salary = jobInfo.salary
          .slice(1, jobInfo.salary.length - 1)
          .replace(",", "~")
        let type = jobInfo.type ? jobInfo.type : jobBox.value[i].type
        if (type === "full-time") {
          jobInfo.salary += "千元/月"
        } else if (type === "part-time") {
          jobInfo.salary += "元/小时"
        }
      }
      Object.assign(jobBox.value[i], jobInfo)
    }
  }
  const removeJob = async (no: number) => {
    let result = false
    if (corp) {
      result = await deleteJob(no, corp.value.corpid)
    }
    if (result) {
      jobBox.value = jobBox.value.filter((value) => value.no !== no)
    } else {
      modalStore.showModel("请重试")
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
      modalStore.showModel("请重试")
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
    location?: string
  ) => {
    let result = false
    if (corp) {
      result = await removeCV(
        action,
        jobNo.value,
        cv,
        corp.value.corpname,
        datetime,
        location
      )
    }
    if (result) {
      cvList.value = cvList.value.filter((v) => v.cv !== cv)
      if (cvList.value.length === 0) {
        hrMode.value = 0
      }
    } else {
      modalStore.showModel("请重试")
    }
  }
</script>

<template>
  <div v-show="!hrMode">
    <SearchBar
      :hrState="userStore.hrState"
      @search="getKeyword"
      @newJob="newJob = true" />
    <article>
      <header>
        <img :src="src" />
        <span>{{ corp?.corpname }}</span>
      </header>
      <p>{{ corp?.brief }}</p>
    </article>
    <JobInfo
      v-if="newJob"
      :no="no"
      :job="job"
      :corpid="corp?.corpid ? corp.corpid : ''"
      @finishJob="finishJob"
      @patchJob="patchJob" />
    <article v-show="!newJob">
      <template v-for="job in jobBox" :key="job.no">
        <JobList
          :hrState="userStore.hrState"
          :corpname="job.corpname"
          :logo="job.logo"
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
  <CVReview v-if="hrMode" :cv="cv" @finishCV="finishCV" />
  <CVList :cvList="cvList" @reviewCV="reviewCV" />
</template>

<style scoped></style>
