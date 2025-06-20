<script setup lang="ts">
  import { computed, ref, inject, watch, useTemplateRef } from 'vue'
  import { storeToRefs } from 'pinia'
  import { getJobList, deleteJob } from '../lib/fetch/jobinfo.ts'
  import { receiveCv, removeCv } from '../lib/fetch/cv.ts'
  import { trueType, trueLocation, getFileUrl } from '../lib/help.ts'
  import { useObserver } from '../lib/use.ts'
  import { corpKey } from '../lib/inject.ts'
  import type { jobItem, jobInfo, cvItem } from '../lib/interface.ts'
  import SearchBar from './SearchBar.vue'
  import JobInfo from './JobInfo.vue'
  import JobList from './JobList.vue'
  import CVList from './CVList.vue'
  import CVReview from './CVReview.vue'
  import { useUserStore } from '../stores/userStore.ts'
  import { useModalStore } from '../stores/modalStore.ts'
  const userStore = useUserStore()
  const modalStore = useModalStore()
  const { hrState } = storeToRefs(userStore)
  const { showModel } = modalStore
  let corp = inject(corpKey)
  let keyword = ref('')
  const getKeyword = async (k: string) => {
    newJob.value = false
    no.value = undefined
    job.value = undefined
    if (keyword.value !== k) {
      keyword.value = k
      await restart()
    }
  }
  const limit = 5
  let offset = 0
  let searching = ref(false)
  let end = ref(false)
  let tip = ref('加载中')
  watch(end, () => tip.value = end.value ? '没有更多了' : '加载中')
  let jobBox = ref<jobItem[]>([])
  const searchJobs = async () => {
    searching.value = true
    let c = Object.create(null) as Record<string, string | number>
    if (keyword.value)
      c['position'] = keyword.value
    c['offset'] = offset
    c['limit'] = limit
    const jobList = await getJobList(c)
    if (jobList) {
      jobBox.value.push(...jobList)
      if (jobList.length < limit) {
        end.value = true
        offset += jobList.length
      }
      else
        offset = offset + limit
    }
    searching.value = false
  }
  const restart = async () => {
    offset = 0
    end.value = false
    jobBox.value.splice(0)
    if (!searching.value) await searchJobs()
  }
  let observed = useTemplateRef('observed')
  let load = ref(false)
  useObserver(observed, load)
  watch(
    load,
    async () => {
      if (!searching.value && !end.value && load.value)
        await searchJobs()
    }
  )
  const url = getFileUrl()
  let src = computed(() =>
    corp?.value['logo'] ? `${url}/png/${corp.value['logo']}.png` : '',
  )
  let newJob = ref(false)
  const finishJob = async () => {
    newJob.value = false
    await restart()
  }
  let no = ref<number>()
  let job = ref<jobItem>()
  const updateJob = (value: number) => {
    newJob.value = true
    no.value = value
    job.value = jobBox.value.find(value => value.no === no.value)
  }
  const patchJob = (jobInfo?: Partial<jobInfo>) => {
    newJob.value = false
    if (jobInfo) {
      let index = jobBox.value.findIndex(value => value.no === no.value)
      if (jobInfo.salary) {
        jobInfo.salary = jobInfo.salary.slice(1, -1).replace(',', '~')
        let type = jobInfo.type ?? jobBox.value[index].type
        switch (type) {
          case 'full-time': {
            jobInfo.salary += '千元/月'
            break
          }
          case 'part-time': {
            jobInfo.salary += '元/小时'
            break
          }
        }
      }
      Object.assign(jobBox.value[index], jobInfo)
    }
    no.value = undefined
    job.value = undefined
  }
  const removeJob = async (no: number) => {
    let result
    if (corp)
      result = await deleteJob(no, corp.value['corpId'])
    if (result)
      jobBox.value = jobBox.value.filter(value => value.no !== no)
    else
      showModel('请重试')
  }
  let cvList = ref<cvItem[]>([])
  let jobNo = ref(0)
  const getCv = async (value: number) => {
    let result = await receiveCv(value)
    if (result) {
      cvList.value = result
      jobNo.value = value
    }
    else
      showModel('请重试')
  }
  let hrMode = ref(0)
  let cv = ref('')
  const reviewCv = (value: string) => {
    hrMode.value = 1
    cv.value = value
  }
  const finishCv = async (
    action: string, cv: string, datetime?: string, location?: string,
  ) => {
    let result
    if (corp)
      result = await removeCv(
        action, jobNo.value, cv, corp.value['corpName'], datetime, location,
      )
    if (result) {
      cvList.value = cvList.value.filter(v => v.cv !== cv)
      if (cvList.value.length === 0)
        hrMode.value = 0
    }
    else
      showModel('请重试')
  }
</script>

<template>
  <section>
    <SearchBar
      :hr-state="hrState"
      @search="getKeyword"
      @new-job="newJob = true"
    />
    <div
      v-show="!newJob"
      class="grid"
    >
      <div>
        <div v-show="!hrMode">
          <article>
            <details>
              <summary>
                <img
                  :src="src"
                  align="left"
                >
                <strong>{{ corp?.["corpName"] }}</strong>
              </summary>
              <p>{{ corp?.["brief"] }}</p>
            </details>
          </article>
          <TransitionGroup name="list">
            <template
              v-for="item in jobBox"
              :key="item.no"
            >
              <JobList
                :hr-state="hrState"
                :corp-name="item.corpInfo.corpName"
                :logo="item.corpInfo.logo"
                :no="item.no"
                @update-job="updateJob"
                @remove-job="removeJob"
                @get-cv="getCv"
              >
                <template #summary>
                  <p>
                    <strong>{{ item.position }}</strong>
                  </p>
                  <ins>{{ trueType(item.type) }}</ins>
                  <span>,&nbsp;</span>
                  <ins>{{ item.salary }}</ins>
                  <span>,&nbsp;</span>
                  <ins>{{ trueLocation(item.location) }}</ins>
                </template>
                <template #overview>
                  {{ item.overview }}
                </template>
              </JobList>
            </template>
          </TransitionGroup>
          <p
            ref="observed"
            class="tip"
          >
            <small>{{ tip }}</small>
          </p>
        </div>
        <Transition name="show">
          <div v-if="hrMode">
            <CVReview
              :cv="cv"
              @finish-cv="finishCv"
            />
          </div>
        </Transition>
      </div>
      <div>
        <CVList
          :cv-list="cvList"
          @review-cv="reviewCv"
        />
      </div>
    </div>
    <Transition name="show">
      <JobInfo
        v-if="newJob"
        :no="no"
        :job="job"
        :corp-id="corp?.['corpId'] ?? ''"
        @finish-job="finishJob"
        @patch-job="patchJob"
      />
    </Transition>
  </section>
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