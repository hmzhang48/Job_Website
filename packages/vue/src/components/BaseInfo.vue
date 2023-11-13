<script setup lang="ts">
import { ref, inject, computed } from "vue"
import { patchInfo, validPhone } from "../lib/connect.js"
import {
  trueLocation,
  initProvince,
  initCity,
  initArea,
  infoKey,
  corpKey,
  updateKey,
} from "../lib/help.js"
import { useUserStore } from "../stores/userStore.js"
import { useValidStore } from "../stores/validStore.js"
import { useModalStore } from "../stores/modalStore.js"
const userStore = useUserStore()
const validStore = useValidStore()
const modalStore = useModalStore()
let info = inject( infoKey )
let corp = inject( corpKey )
let update = inject( updateKey, () => { } )
let l = ref( false )
let p = ref( false )
let provinceSelect = ref<HTMLSelectElement>()
let citySelect = ref<HTMLSelectElement>()
let areaSelect = ref<HTMLSelectElement>()
const changeLocation = () => {
  if ( l.value ) {
    checkArea()
  } else {
    l.value = true
    if ( provinceSelect.value ) {
      initProvince( provinceSelect.value )
    }
  }
}
const addCity = () => {
  initCity( provinceSelect.value, citySelect.value, areaSelect.value )
}
const addArea = () => {
  initArea( citySelect.value, areaSelect.value )
}
let area = ref( "area" )
let invalidArea = ref( false )
let location = computed( () => {
  if ( info ) {
    return trueLocation( info.value.location )
  } else {
    return ""
  }
} )
const checkArea = async () => {
  if ( area.value === "area" ) {
    invalidArea.value = true
  } else {
    let result = await patchInfo( "userinfo", undefined, area.value )
    if ( result ) {
      l.value = false
      update( "location", area.value )
    } else {
      modalStore.showModel( "请重试" )
    }
  }
}
let newPhone = ref( "" )
let invalidPhone = ref( false )
let wrong = ref( "" )
const changePhone = () => {
  if ( p.value ) {
    checkCode()
  } else {
    p.value = true
  }
}
const phoneRegex = new RegExp( /^\d{11}$/ )
const checkPhone = () => {
  resetCode()
  if ( !phoneRegex.test( newPhone.value ) ) {
    invalidPhone.value = true
    wrong.value = "手机号格式有误"
    return false
  } else {
    return true
  }
}
let loading = ref( false )
let validCode: string | null
const sendCode = async () => {
  if ( checkPhone() ) {
    loading.value = true
    validCode = await validPhone( newPhone.value )
    loading.value = false
    if ( validCode ) {
      countDown()
    }
  }
}
let disabled = ref( false )
let buttonContent = ref( "发送验证码" )
const countDown = () => {
  let wait = 60
  disabled.value = true
  const count = () => {
    if ( wait >= 0 ) {
      buttonContent.value = wait + "秒后可重试"
      wait -= 1
      setTimeout( count, 1000 )
    } else {
      buttonContent.value = "发送验证码"
      disabled.value = false
    }
  }
  count()
}
let code = ref( "" )
const checkCode = async () => {
  if ( code.value === validCode ) {
    invalidPhone.value = false
    let result = await patchInfo(
      userStore.hrState ? "hrinfo" : "userinfo",
      newPhone.value,
      undefined,
    )
    if ( result ) {
      p.value = false
      update( "phone", newPhone.value )
    } else {
      modalStore.showModel( "请重试" )
    }
  } else {
    invalidPhone.value = true
  }
}
const resetCode = () => {
  validCode = null
  if ( code.value !== "" ) {
    code.value = ""
    invalidPhone.value = false
  }
}
</script>

<template>
  <article>
    <table>
      <tbody>
        <tr>
          <th scope="row">姓名</th>
          <td>{{ info?.name }}</td>
          <td v-if=" !userStore.hrState ">
            <mark>{{ validStore.validState ? "已认证" : "未认证" }}</mark>
          </td>
        </tr>
        <tr>
          <th scope="row">{{ userStore.hrState ? "员工编号" : "身份证号" }}</th>
          <td>{{ info?.id }}</td>
          <td v-if=" !userStore.hrState ">
            <mark>{{ validStore.validState ? "已认证" : "未认证" }}</mark>
          </td>
        </tr>
        <tr v-if=" userStore.hrState ">
          <th scope="row">公司名称</th>
          <td>{{ corp?.corpName }}</td>
          <td>
            <mark>{{ validStore.validState ? "已认证" : "未认证" }}</mark>
          </td>
        </tr>
        <tr v-if=" userStore.hrState ">
          <th scope="row">统一社会信用代码</th>
          <td>{{ corp?.corpID }}</td>
          <td v-if=" userStore.hrState ">
            <mark>{{ validStore.validState ? "已认证" : "未认证" }}</mark>
          </td>
        </tr>
        <tr v-if=" !userStore.hrState ">
          <th scope="row">居住地</th>
          <td>{{ location }}</td>
          <td v-show=" l ">
            <select id="province" ref="provinceSelect" @change=" addCity ">
              <option value="province" selected>省(直辖市)</option>
            </select>
            <select id="city" ref="citySelect" @change=" addArea ">
              <option value="city" selected>市</option>
            </select>
            <select v-model.lazy=" area " id="area" ref="areaSelect">
              <option value="area" selected>区(县)</option>
            </select>
            <p><small v-show=" invalidArea ">居住地未选择</small></p>
          </td>
          <td>
            <span role="button" @click.prevent=" changeLocation ">修改</span>
          </td>
        </tr>
        <tr>
          <th scope="row">手机号码</th>
          <td>{{ info?.phone }}</td>
          <td v-show=" p ">
            <input v-model.lazy=" newPhone " @change=" checkPhone " type="text" id="phone" placeholder="请输入手机号码" required />
            <input v-model.lazy=" code " type="text" id="code" placeholder="请输入验证码" required />
            <button :aria-busy=" loading " :disabled=" disabled " @click.prevent=" sendCode " type="button">
              {{ buttonContent }}
            </button>
            <p>
              <small v-show=" invalidPhone ">{{ wrong }}</small>
            </p>
          </td>
          <td>
            <span role="button" @click.prevent=" changePhone ">修改</span>
          </td>
        </tr>
      </tbody>
    </table>
  </article>
</template>

<style scoped>
</style>
