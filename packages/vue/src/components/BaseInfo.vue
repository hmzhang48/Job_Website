<script setup lang="ts">
import { ref, inject, computed, onMounted, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { patchUserInfo } from '../lib/fetch/userinfo.ts'
import { patchHRInfo } from '../lib/fetch/hrinfo.ts'
import { validPhone } from '../lib/fetch/register.ts'
import { trueLocation, initProvince, initCity, initArea } from '../lib/help.ts'
import { infoKey, corpKey, updateKey } from '../lib/inject.ts'
import { useUserStore } from '../stores/userStore.ts'
import { useValidStore } from '../stores/validStore.ts'
import { useModalStore } from '../stores/modalStore.ts'
const userStore = useUserStore()
const validStore = useValidStore()
const modalStore = useModalStore()
const { hrState } = storeToRefs(userStore)
const { validState } = storeToRefs(validStore)
const { showModel } = modalStore
let info = inject(infoKey)
let corp = inject(corpKey)
let update = inject(updateKey, () => ({}))
let l = ref(false)
let p = ref(false)
let provinceSelect = useTemplateRef('provinceSelect')
let citySelect = useTemplateRef('citySelect')
let areaSelect = useTemplateRef('areaSelect')
onMounted(() => initProvince(provinceSelect.value))
const addCity = () => initCity(provinceSelect.value, citySelect.value, areaSelect.value)
const addArea = () => initArea(citySelect.value, areaSelect.value)
let area = ref('area')
let invalidArea = ref(false)
let location = computed(() => info ? trueLocation(info.value['location']) : '')
let loading = ref(false)
const checkArea = async () => {
  if (area.value === 'area' || area.value === info?.value['location']) {
    invalidArea.value = true
  }
  else {
    loading.value = true
    let result = await patchUserInfo({ location: area.value })
    if (result) {
      l.value = false
      update('location', area.value)
    }
    else {
      showModel('请重试')
    }
    loading.value = false
  }
}
let newPhone = ref('')
let invalidPhone = ref(false)
let invalidCode = ref(false)
const phoneRegex = new RegExp(/^\d{11}$/)
const checkPhone = () => {
  resetCode()
  invalidPhone.value = !phoneRegex.test(newPhone.value) && (newPhone.value === info?.value['phone'])
}
let disabled = ref(false)
let validCode = ''
const sendCode = async () => {
  checkPhone()
  if (!invalidPhone.value) {
    disabled.value = true
    countDown()
    validCode = await validPhone(newPhone.value)
  }
}
let wait = ref(60)
const countDown = () => {
  disabled.value = true
  const count = () => {
    if (wait.value > 0) {
      wait.value -= 1
      setTimeout(count, 1000)
    }
    else {
      disabled.value = false
      wait.value = 60
    }
  }
  count()
}
let code = ref('')
const checkCode = async () => {
  if (validCode !== '' && code.value === validCode) {
    loading.value = true
    invalidCode.value = false
    let result = await (
      hrState.value ? patchHRInfo(newPhone.value) : patchUserInfo({ phone: newPhone.value })
    )
    if (result) {
      p.value = false
      update('phone', newPhone.value)
    }
    else {
      showModel('请重试')
    }
    loading.value = false
  }
  else {
    invalidCode.value = true
  }
}
const resetCode = () => {
  validCode = ''
  if (code.value !== '') {
    code.value = ''
    invalidPhone.value = false
  }
}
</script>

<template>
  <article>
    <div class="row">
      <p class="item">
        <strong>姓名</strong>
      </p>
      <div class="content">
        <span>{{ info?.["name"] }}</span>
        <mark v-if="!hrState">{{ validState ? "已认证" : "未认证" }}</mark>
      </div>
    </div>
    <hr>
    <div class="row">
      <p class="item">
        <strong>{{ hrState ? "员工编号" : "身份证号" }}</strong>
      </p>
      <div class="content">
        <span>{{ info?.["id"] }}</span>
        <mark v-if="!hrState">{{ validState ? "已认证" : "未认证" }}</mark>
      </div>
    </div>
    <hr>
    <div v-if="hrState">
      <div class="row">
        <p class="item">
          <strong>公司名称</strong>
        </p>
        <div class="content">
          <span>{{ corp?.["corpName"] }}</span>
          <mark>{{ validState ? "已认证" : "未认证" }}</mark>
        </div>
      </div>
      <hr>
    </div>
    <div v-if="hrState">
      <div class="row">
        <p class="item">
          <strong>统一社会信用代码</strong>
        </p>
        <div class="content">
          <span>{{ corp?.["corpId"] }}</span>
          <mark>{{ validState ? "已认证" : "未认证" }}</mark>
        </div>
      </div>
      <hr>
    </div>
    <div v-if="!hrState">
      <div
        v-show="!l"
        class="row"
      >
        <p class="item">
          <strong>居住地</strong>
        </p>
        <div class="content">
          <span>{{ location }}</span>
          <mark @click.prevent="l = true">
            修改
          </mark>
        </div>
      </div>
      <div v-show="l">
        <fieldset role="group">
          <select
            id="province"
            ref="provinceSelect"
            @change="addCity"
          >
            <option
              value="province"
              selected
            >
              省(直辖市)
            </option>
          </select>
          <select
            id="city"
            ref="citySelect"
            @change="addArea"
          >
            <option
              value="city"
              selected
            >
              市
            </option>
          </select>
          <select
            id="area"
            ref="areaSelect"
            v-model.lazy="area"
          >
            <option
              value="area"
              selected
            >
              区(县)
            </option>
          </select>
        </fieldset>
        <small v-show="invalidArea">居住地未选择</small>
        <div class="button">
          <button
            :aria-busy="loading"
            @click.prevent="checkArea"
          >
            修改
          </button>
          <button @click.prevent="l=false">
            返回
          </button>
        </div>
      </div>
      <hr>
    </div>
    <div>
      <div
        v-show="!p"
        class="row"
      >
        <p class="item">
          <strong>手机号码</strong>
        </p>
        <div class="content">
          <span>{{ info?.["phone"] }}</span>
          <mark @click.prevent="p = true">
            修改
          </mark>
        </div>
      </div>
      <div v-show="p">
        <input
          id="phone"
          v-model.lazy="newPhone"
          type="text"
          placeholder="请输入手机号码"
          required
          @change="checkPhone"
        >
        <small v-show="invalidPhone">手机号格式有误</small>
        <fieldset role="group">
          <input
            id="code"
            v-model.lazy="code"
            type="text"
            placeholder="请输入验证码"
            required
          >
          <input
            type="button"
            :value="disabled ? wait + '秒后可重试' : '发送验证码'"
            :disabled="disabled"
            @click.prevent="sendCode"
          >
        </fieldset>
        <small v-show="invalidCode">验证码有误</small>
        <div class="button">
          <button
            :aria-busy="loading"
            @click.prevent="checkCode()"
          >
            修改
          </button>
          <button @click.prevent="p=false">
            返回
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.row {
  display: flex;
}
.item {
  flex: none;
  margin-bottom: 0;
}
.content {
  width: 100%;
  text-align: right;
}
mark {
  margin-left: 10px;
  cursor: pointer;
}
.button {
  display: flex;
  justify-content: center;
  gap: 25px;
}
</style>
