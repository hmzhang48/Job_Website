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
  { path: "/", name: "index", component: RegisterEmail },
  { path: "/login", name: "login", component: LoginEmail },
  { path: "/guideUser", name: "guideUser", component: GuideUser },
  { path: "/guideHR", name: "guideHR", component: GuideHR },
  { path: "/userPage", name: "userPage", component: UserPage },
  { path: "/userSetting/:tab", name: "userSetting", component: UserSetting, props: true },
  { path: "/infoBox", name: "infoBox", component: InfoBox },
  { path: "/hrPage", name: "hrPage", component: HRpage },
  { path: "/hrSetting", name: "hrSetting", component: HRSetting }
]
