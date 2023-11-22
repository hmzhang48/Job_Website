<script setup lang="ts">
  import { ref, computed, watch } from "vue"
  import { storeToRefs } from "pinia"
  import { useRouter } from "vue-router"
  import { useUserStore } from "../stores/userStore.js"
  import { useValidStore } from "../stores/validStore.js"
  import { useModalStore } from "../stores/modalStore.js"
  import SearchBar from "./SearchBar.vue"
  import FilterPanel from "./FilterPanel.vue"
  import JobList from "./JobList.vue"
  import { getCorpInfo, getJobList, deliverCV } from "../lib/connect.js"
  import type { jobInfo, jobItem } from "../lib/connect.js"
  import { domain, trueType, trueLocation, useObserver } from "../lib/help.js"
  const router = useRouter()
  const userStore = useUserStore()
  const validStore = useValidStore()
  const modalStore = useModalStore()
  const { hrState } = storeToRefs(userStore)
  const { cvState } = storeToRefs(validStore)
  const { modalState, confirmState } = storeToRefs(modalStore)
  const { showModel } = modalStore
  watch(modalState, () => {
    if (confirmState.value && !cvState.value) {
      router.push({
        path: "/userSetting/cv",
      })
      confirmState.value = false
    }
  })
  let keyword = ref("")
  const getKeyword = (k: string) => {
    keyword.value = k
    restart()
  }
  let filter = ref<Omit<jobInfo, "overview" | "position"> & { logo: string }>({
    type: "",
    salary: "",
    location: "",
    logo: "",
  })
  const getCondition = (c: Partial<Omit<jobInfo, "overview" | "position">>) => {
    Object.assign(filter.value, c)
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
    Object.assign(c, filter.value)
    for (const [key, value] of Object.entries(c)) {
      if (!value) {
        delete c[
          key as keyof (Partial<Omit<jobInfo, "overview">> & {
            logo?: string
            offset?: number
          })
        ]
      }
    }
    c.offset = offset
    const jobList = await getJobList(c)
    jobBox.value.push(...jobList)
    if (jobList.length < limit) {
      end.value = true
      offset += jobList.length
    } else {
      offset += limit
    }
  }
  const restart = () => {
    offset = 0
    end.value = false
    jobBox.value.splice(0)
  }
  let observed = ref<HTMLParagraphElement>()
  useObserver(observed, searchJobs, end)
  let corp = ref({
    show: false,
    corpname: "",
    logo: "",
    brief: "",
  })
  let src = computed(() => {
    return corp.value.logo
      ? `${domain}/fastify/image/${corp.value.logo}.png`
      : ""
  })
  const showCorp = async (logo: string) => {
    let c = await getCorpInfo(logo)
    Object.assign(corp.value, c.info)
    corp.value.show = true
    corp.value.logo = logo
    filter.value.logo = logo
    restart()
  }
  const hideCorp = () => {
    corp.value.show = false
    filter.value.logo = ""
    restart()
  }
  const hideJob = (no: number) => {
    jobBox.value = jobBox.value.filter((value) => value.no !== no)
  }
  const sendCV = async (no: number) => {
    if (cvState.value) {
      const result = await deliverCV(no)
      if (result) {
        showModel("简历投递成功")
        hideJob(no)
      } else {
        showModel("请重试")
      }
    } else {
      showModel("请先上传简历", true)
    }
  }
</script>

<template>
  <SearchBar
    :hrState="hrState"
    @search="getKeyword" />
  <article v-if="corp.show">
    <header>
      <img :src="src" />
      <span>{{ corp.corpname }}</span>
    </header>
    <p>{{ corp.brief }}</p>
    <footer><button @click.prevent="hideCorp">关闭</button></footer>
  </article>
  <article>
    <template
      v-for="job in jobBox"
      :key="job.no">
      <JobList
        :hrState="hrState"
        :corpname="job.corpInfo.corpName"
        :logo="job.corpInfo.logo"
        :position="job.position"
        :no="job.no"
        @searchCorp="showCorp"
        @sendCV="sendCV">
        <template #summary>
          <h1>{{ job.position }}</h1>
          <mark>{{ trueType(job.type) }}</mark>
          <mark>{{ job.salary }}</mark>
          <mark>{{ trueLocation(job.location) }}</mark>
        </template>
        <template #overview>{{ job.overview }}</template>
      </JobList>
    </template>
    <p ref="observed">{{ tip }}</p>
  </article>
  <FilterPanel @filter="getCondition" />
</template>

<style scoped></style>
