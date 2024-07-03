<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { getCorpInfo } from '../lib/fetch/corpinfo.ts'
import { getJobList } from '../lib/fetch/jobinfo.ts'
import { deliverCv } from '../lib/fetch/cv.ts'
import { trueType, trueLocation } from '../lib/help.ts'
import { useObserver } from '../lib/use.ts'
import type { jobInfo, jobItem } from '../lib/interface.ts'
import SearchBar from './SearchBar.vue'
import FilterPanel from './FilterPanel.vue'
import JobList from './JobList.vue'
import { useUserStore } from '../stores/userStore.ts'
import { useValidStore } from '../stores/validStore.ts'
import { useModalStore } from '../stores/modalStore.ts'
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
    void router.push({ path: '/userSetting/cv' })
    confirmState.value = false
  }
})
let keyword = ref('')
const getKeyword = async (k: string) => {
  keyword.value = k
  await restart()
}
let filter = ref(Object.create(null) as Partial<Omit<jobInfo, 'overview' | 'position'>> & { logo?: string })
const getCondition = async (c: Partial<Omit<jobInfo, 'overview' | 'position'>>) => {
  Object.assign(filter.value, c)
  await restart()
}
const resetCondition = async () => {
  filter.value.type = undefined
  filter.value.salary = undefined
  filter.value.location = undefined
  await restart()
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
  if (keyword.value) {
    c['position'] = keyword.value
  }
  for (const [key, value] of Object.entries(filter.value)) {
    if (value) {
      c[key] = value
    }
  }
  c['offset'] = offset
  c['limit'] = limit
  const jobList = await getJobList(c)
  if (jobList) {
    jobBox.value.push(...jobList)
    if (jobList.length < limit) {
      end.value = true
      offset += jobList.length
    }
    else {
      offset += limit
    }
  }
  searching.value = false
}
const restart = async () => {
  offset = 0
  end.value = false
  jobBox.value.splice(0)
  if (!searching.value) {
    await searchJobs()
  }
}
let observed = ref<HTMLParagraphElement>()
let load = ref(false)
useObserver(observed, load)
watch(load, async () => {
  if (!searching.value && !end.value && load.value) {
    await searchJobs()
  }
})
let corp = ref({
  show: false, corpName: '', logo: '', brief: '',
})
let src = computed(() =>
  corp.value.logo ? `/image/${corp.value.logo}.png` : '',
)
const showCorp = async (logo: string) => {
  let c = await getCorpInfo(logo)
  if (c) {
    Object.assign(corp.value, c.info)
    corp.value.show = true
    corp.value.logo = logo
    filter.value.logo = logo
    await restart()
  }
}
const hideCorp = async () => {
  corp.value.show = false
  filter.value.logo = undefined
  await restart()
}
const hideJob = (no: number) => {
  jobBox.value = jobBox.value.filter(value => value.no !== no)
}
const sendCV = async (no: number) => {
  if (cvState.value) {
    const result = await deliverCv(no)
    if (result) {
      showModel('简历投递成功')
      hideJob(no)
    }
    else {
      showModel('请重试')
    }
  }
  else {
    showModel('请先上传简历', true)
  }
}
</script>

<template>
  <section>
    <SearchBar
      :hr-state="hrState"
      @search="getKeyword"
    />
    <div class="grid">
      <div>
        <Transition name="show">
          <article v-if="corp.show">
            <header>
              <img :src="src">
              <strong>{{ corp.corpName }}</strong>
            </header>
            <p>{{ corp.brief }}</p>
            <footer>
              <button
                class="outline"
                @click.prevent="hideCorp"
              >
                关闭
              </button>
            </footer>
          </article>
        </Transition>
        <TransitionGroup name="list">
          <template
            v-for="job in jobBox"
            :key="job.no"
          >
            <JobList
              :hr-state="hrState"
              :corp-name="job.corpInfo.corpName"
              :logo="job.corpInfo.logo"
              :no="job.no"
              @search-corp="showCorp"
              @send-cv="sendCV"
            >
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
          ref="observed"
          class="tip"
        >
          <small>{{ tip }}</small>
        </p>
      </div>
      <div>
        <FilterPanel
          @filter="getCondition"
          @reset="resetCondition"
        />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
img {
  height: 48px;
  margin: auto 12px;
}
footer {
  text-align: right;
}
.grid {
  grid-template-columns: 2fr 1fr;
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
