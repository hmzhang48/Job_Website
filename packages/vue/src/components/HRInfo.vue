<script setup lang="ts">
  import { ref, watch } from "vue"
  import {
    validPhone,
    uploadImage,
    existCorp,
    postHRInfo,
  } from "../lib/connect.ts"
  import { useCanvas, loadImage } from "../lib/help.ts"
  const props = defineProps<{
    exist: boolean
  }>()
  const emits = defineEmits<{
    hrInfo: []
    corpInfo: [hr_id: string, corp_id: string]
  }>()
  watch(
    () => props.exist,
    async (value) => {
      if (value) {
        const result = await upload()
        if (result) {
          emits("hrInfo")
        }
      }
    },
  )
  const invalidKey = "aria-invalid"
  let invalid = ref<Record<string, boolean>>({})
  let name = ref("")
  const checkName = () => {
    invalid.value["name"] = name.value === "" ? true : false
  }
  let origin = await loadImage("./vue.svg")
  let canvas = ref<HTMLCanvasElement>()
  let image = await useCanvas(canvas, origin)
  let avatar = ref<File>()
  let avatarInput = ref<HTMLInputElement>()
  watch(avatar, async () => {
    if (avatar.value) {
      image.value = await loadImage(avatar.value)
    }
  })
  const getAvatar = () => {
    return new Promise((resolve: (value: File) => void) => {
      canvas.value?.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], "avatar.png", { type: "image/png" }))
        }
      })
    })
  }
  const checkAvatar = async () => {
    const file = avatarInput.value?.files?.[0]
    if (file && file.size < 102_400) {
      avatar.value = file
    } else {
      invalid.value["avatar"] = true
    }
  }
  let hrID = ref("")
  const checkHRID = () => {
    invalid.value["hrID"] = hrID.value === "" ? true : false
  }
  let corpID = ref("")
  const corpIDRegex = new RegExp(
    /^[\dA-HJ-NP-RTUW-Y]{2}\d{6}[\dA-HJ-NP-RTUW-Y]{10}$/,
    "i",
  )
  const checkCorpID = () => {
    invalid.value["corpID"] = corpIDRegex.test(corpID.value) ? false : true
  }
  let phone = ref("")
  const phoneRegex = new RegExp(/^\d{11}$/)
  const checkPhone = () => {
    resetCode()
    if (phoneRegex.test(phone.value)) {
      invalid.value["phone"] = false
      return true
    } else {
      invalid.value["phone"] = true
      return false
    }
  }
  let loading = ref(false)
  let validCode: string | undefined
  const sendCode = async () => {
    if (checkPhone()) {
      loading.value = true
      validCode = await validPhone(phone.value)
      loading.value = false
      if (validCode) {
        countDown()
      }
    }
  }
  let disabled = ref(false)
  let buttonContent = ref("发送验证码")
  const countDown = () => {
    let wait = 60
    disabled.value = true
    const count = () => {
      if (wait >= 0) {
        buttonContent.value = wait + "秒后可重试"
        wait -= 1
        setTimeout(count, 1000)
      } else {
        buttonContent.value = "发送验证码"
        disabled.value = false
      }
    }
    count()
  }
  let code = ref("")
  const checkCode = () => {
    invalid.value["code"] = code.value === validCode ? false : true
  }
  const resetCode = () => {
    validCode = undefined
    if (code.value !== "") {
      code.value = ""
      invalid.value["code"] = true
    }
  }
  const keys = new Set(["name", "avatar", "hrID", "corpID", "phone", "code"])
  const check = () => {
    let result = true
    for (let key in invalid.value) {
      if (!keys.has(key)) {
        invalid.value[key] = true
      }
      if (invalid.value[key] && result) {
        result = false
      }
    }
    return result
  }
  const upload = async () => {
    const avatar = await getAvatar()
    const formData = new FormData()
    formData.append("avatar", avatar)
    const fileName = await uploadImage(formData)
    if (fileName) {
      const hrInfo = {
        name: name.value,
        avatar: fileName,
        hrID: hrID.value,
        corpID: corpID.value,
        phone: phone.value,
      }
      const result = await postHRInfo(hrInfo)
      return result
    } else {
      return false
    }
  }
  const submit = async () => {
    const result = check()
    if (result) {
      let result = await existCorp(corpID.value)
      if (result) {
        result = await upload()
        if (result) {
          emits("hrInfo")
        }
      } else {
        emits("corpInfo", hrID.value, corpID.value)
      }
    }
  }
</script>

<template>
  <section>
    <article>
      <h1>请先完善个人基本信息</h1>
      <label for="name">姓名</label>
      <input
        id="name"
        type="text"
        placeholder="请输入真实姓名"
        required
        v-model.lazy="name"
        :[invalidKey]="invalid['name']"
        @change="checkName" />
      <p><small v-show="invalid['name']">姓名格式有误</small></p>
      <label for="avatar">头像</label>
      <div class="grid">
        <div>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            ref="avatarInput"
            @change="checkAvatar" />
          <p><small v-show="invalid['avatar']">头像图片需小于100KB</small></p>
        </div>
        <canvas
          id="canvas"
          width="128"
          height="128"
          ref="canvas" />
      </div>
      <label for="hrID">工号</label>
      <input
        id="hrID"
        type="text"
        placeholder="请填写工号"
        required
        :[invalidKey]="invalid['hrID']"
        v-model.lazy="hrID"
        @change="checkHRID" />
      <p><small v-show="invalid['hrID']">工号格式有误</small></p>
      <label for="corpID">企业ID</label>
      <input
        id="corpID"
        type="text"
        placeholder="请填写企业统一社会信用代码"
        required
        :[invalidKey]="invalid['corpID']"
        v-model.lazy="corpID"
        @change="checkCorpID" />
      <p><small v-show="invalid['corpID']">统一社会信用代码格式有误</small></p>
      <label for="phone">电话</label>
      <input
        id="phone"
        type="text"
        placeholder="请输入手机号码"
        required
        :[invalidKey]="invalid['phone']"
        v-model.lazy="phone"
        @change="checkPhone" />
      <p><small v-show="invalid['phone']">手机号格式有误</small></p>
      <label for="code">验证码</label>
      <div class="grid">
        <input
          id="code"
          type="text"
          placeholder="请输入验证码"
          required
          :[invalidKey]="invalid['code']"
          v-model.lazy="code"
          @change="checkCode" />
        <button
          type="button"
          :aria-busy="loading"
          :disabled="disabled"
          @click.prevent="sendCode">
          {{ buttonContent }}
        </button>
      </div>
      <p><small v-show="invalid['code']">验证码有误</small></p>
      <button
        type="submit"
        @click.prevent="submit">
        完成
      </button>
    </article>
  </section>
</template>

<style scoped></style>
