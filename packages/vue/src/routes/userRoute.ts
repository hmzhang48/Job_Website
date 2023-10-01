import RegisterEmail from "../components/RegisterEmail.vue"
import LoginEmail from "../components/LoginEmail.vue"
import GuideUser from "../components/GuideUser.vue"
import GuideHR from "../components/GuideHR.vue"
import UserPage from "../components/UserPage.vue"
import UserSetting from "../components/UserSetting.vue"
import InfoBox from "../components/InfoBox.vue"
import HRpage from "../components/HRPage.vue"
import HRSetting from "../components/HRSetting.vue"

export const userRoute = [
  { path: '/', component: RegisterEmail },
  { path: '/login', component: LoginEmail },
  { path: '/guideUser', component: GuideUser },
  { path: '/guideHR', component: GuideHR },
  { path: '/userPage', component: UserPage },
  { path: '/userSetting/:tab', component: UserSetting, props: true },
  { path: '/infoBox', component: InfoBox },
  { path: '/hrPage', component: HRpage },
  { path: '/hrSetting', component: HRSetting }
]
