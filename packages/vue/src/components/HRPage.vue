<script setup lang="ts">
  import { computed, ref, inject, watch } from "vue"
  import { storeToRefs } from "pinia"
  import { getJobList, deleteJob } from "../lib/fetch/jobinfo.ts"
  import { receiveCV, removeCV } from "../lib/fetch/cv.ts"
  import { trueType, trueLocation } from "../lib/help.ts"
  import { useObserver } from "../lib/use.ts"
  import { corpKey } from "../lib/inject.ts"
  import type { jobItem, jobInfo, cvItem } from "../lib/interface.ts"
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
    newJob.value = false
    if (keyword.value !== k) {
      keyword.value = k
      restart()
    }
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
    let c: Record<string, string | number> = Object.create(null)
    if (keyword.value) {
      c["position"] = keyword.value
    }
    c["offset"] = offset
    c["limit"] = limit
    const jobList = await getJobList(c)
    if (jobList) {
      jobBox.value.push(...jobList)
      if (jobList.length < limit) {
        end.value = true
        offset += jobList.length
      } else {
        offset = offset + limit
      }
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
  let src = computed(() =>
    corp?.value["logo"] ? `/fastify/image/${corp.value["logo"]}.png` : ""
  )
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
    let result
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
    location?: string
  ) => {
    let result
    if (corp) {
      result = await removeCV(
        action,
        jobNo.value,
        cv,
        corp.value["corpName"],
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
      showModel("请重试")
    }
  }
</script>

<template>
  <SearchBar
    :hrState="hrState"
    @search="getKeyword"
    @newJob="newJob = true" />
  <Transition
    name="show"
    mode="out-in">
    <div
      class="grid"
      v-if="!newJob">
      <Transition
        name="show"
        mode="out-in">
        <div v-if="!hrMode">
          <article>
            <details>
              <summary>
                <img
                  :src="src"
                  align="left" />
                <strong>{{ corp?.["corpName"] }}</strong>
              </summary>
              <p>{{ corp?.["brief"] }}</p>
            </details>
          </article>
          <TransitionGroup name="list">
            <template
              v-for="job in jobBox"
              :key="job.no">
              <JobList
                :hrState="hrState"
                :corpName="job.corpInfo.corpName"
                :logo="job.corpInfo.logo"
                :position="job.position"
                :no="job.no"
                @updateJob="updateJob"
                @removeJob="removeJob"
                @getCV="getCV">
                <template #summary>
                  <p>
                    <strong>{{ job.position }}</strong>
                  </p>
                  <ins>{{ trueType(job.type) }}</ins>
                  <span>,&nbsp;</span>
                  <ins>{{ job.salary }}</ins>
                  <span>,&nbsp;</span>
                  <ins>{{ trueLocation(job.location) }}</ins>
                </template>
                <template #overview>
                  {{ job.overview }}
                </template>
              </JobList>
            </template>
          </TransitionGroup>
          <p
            class="tip"
            ref="observed">
            <small>{{ tip }}</small>
          </p>
        </div>
        <div v-else>
          <CVReview
            :cv="cv"
            @finishCV="finishCV" />
        </div>
      </Transition>
      <div>
        <CVList
          :cvList="cvList"
          @reviewCV="reviewCV" />
      </div>
    </div>
    <JobInfo
      v-else
      :no="no"
      :job="job"
      :corpID="corp?.['corpID'] ? corp['corpID'] : ''"
      @finishJob="finishJob"
      @patchJob="patchJob" />
  </Transition>
</template>

<style scoped lang="scss">
  img {
    height: 24px;
    margin: 0 10px;
  }
  details {
    margin-bottom: 0;
  }
  .grid {
    grid-template-columns: 3fr 1fr;
    gap: 20px;
  }
  .tip {
    text-align: center;
  }
  .list-move,
  .list-enter-active,
  .list-leave-active {
    transition: all 0.3s ease-in-out;
  }
  .list-enter-from,
  .list-leave-to {
    transform: translateY(20px);
    opacity: 0;
  }
  .list-leave-active {
    position: absolute;
  }
  .show-enter-active,
  .show-leave-active {
    transition: all 0.3s ease-in-out;
  }
  .show-enter-from,
  .show-leave-to {
    transform: scale(0.3);
    opacity: 0;
  }
</style>
