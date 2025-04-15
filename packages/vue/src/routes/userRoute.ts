import type { Component } from 'vue'
import RegisterEmail from '../components/RegisterEmail.vue'
import LoginEmail from '../components/LoginEmail.vue'
import GuideUser from '../components/GuideUser.vue'
import GuideHR from '../components/GuideHR.vue'
import UserPage from '../components/UserPage.vue'
import UserSetting from '../components/UserSetting.vue'
import InfoBox from '../components/InfoBox.vue'
import HRpage from '../components/HRPage.vue'
import HRSetting from '../components/HRSetting.vue'
export const userRoute = [
  { path: '/', name: 'index', component: RegisterEmail as Component },
  { path: '/login', name: 'login', component: LoginEmail as Component },
  { path: '/guideUser', name: 'guideUser', component: GuideUser as Component },
  { path: '/guideHR', name: 'guideHR', component: GuideHR as Component },
  { path: '/userPage', name: 'userPage', component: UserPage as Component },
  { path: '/userSetting/:tab?', name: 'userSetting', component: UserSetting as Component, props: true },
  { path: '/infoBox', name: 'infoBox', component: InfoBox as Component },
  { path: '/hrPage', name: 'hrPage', component: HRpage as Component },
  { path: '/hrSetting', name: 'hrSetting', component: HRSetting as Component },
]