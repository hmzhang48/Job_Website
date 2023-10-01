<!-- @format -->

<script setup lang="ts">
  import { ref, watch } from "vue"
  import {
    validPhone,
    uploadImage,
    existCorp,
    postHRInfo
  } from "../lib/connect.js"
  import { useCanvas, loadImage } from "../lib/help.js"
  const props = defineProps<{
    exist: boolean
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
    }
  )
  const invalidKey = "aria-invalid"
  let invalid = ref<Record<string, boolean>>({})
  let name = ref("")
  const checkName = () => {
    if (name.value === "") {
      invalid.value.name = true
    } else {
      invalid.value.name = false
    }
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
    if (file && file.size < 102400) {
      avatar.value = file
    } else {
      invalid.value.avatar = true
    }
  }
  let hrid = ref("")
  const checkHRID = () => {
    if (hrid.value === "") {
      invalid.value.hrid = true
    } else {
      invalid.value.hrid = false
    }
  }
  let corpid = ref("")
  const corpIDRegex = new RegExp(
    /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
    "i"
  )
  const checkCorpID = () => {
    if (!corpIDRegex.test(corpid.value)) {
      invalid.value.corpid = true
    } else {
      invalid.value.corpid = false
    }
  }
  let phone = ref("")
  const phoneRegex = new RegExp(/^\d{11}$/)
  const checkPhone = () => {
    resetCode()
    if (!phoneRegex.test(phone.value)) {
      invalid.value.phone = true
      return false
    } else {
      invalid.value.phone = false
      return true
    }
  }
  let loading = ref(false)
  let validCode: string | null
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
    if (code.value === validCode) {
      invalid.value.code = false
    } else {
      invalid.value.code = true
    }
  }
  const resetCode = () => {
    validCode = null
    if (code.value !== "") {
      code.value = ""
      invalid.value.code = true
    }
  }
  const keys = ["name", "avatar", "hrid", "corpid", "phone", "code"]
  const check = () => {
    let result = true
    for (let key in invalid.value) {
      if (!keys.includes(key)) {
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
        hrid: hrid.value,
        corpid: corpid.value,
        phone: phone.value
      }
      const result = await postHRInfo(hrInfo)
      return result
    } else {
      return false
    }
  }
  const emits = defineEmits<{
    hrInfo: []
    corpInfo: [hrid: string, corpid: string]
  }>()
  const submit = async () => {
    const result = check()
    if (result) {
      let result = await existCorp(corpid.value)
      if (result) {
        result = await upload()
        if (result) {
          emits("hrInfo")
        }
      } else {
        emits("corpInfo", hrid.value, corpid.value)
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
        v-model.lazy="name"
        :[invalidKey]="invalid.name"
        @change="checkName"
        type="text"
        id="name"
        placeholder="请输入真实姓名"
        required />
      <p><small v-show="invalid.name">姓名格式有误</small></p>
      <label for="avatar">头像</label>
      <div class="grid">
        <div>
          <input
            type="file"
            accept="image/*"
            id="avatar"
            ref="avatarInput"
            @change="checkAvatar" />
          <p>
            <small v-show="invalid.avatar">头像图片需小于100KB</small>
          </p>
        </div>
        <canvas width="128" height="128" id="canvas" ref="canvas"></canvas>
      </div>
      <label for="id">工号</label>
      <input
        v-model.lazy="hrid"
        :[invalidKey]="invalid.hrid"
        @change="checkHRID"
        type="text"
        id="id"
        placeholder="请填写工号"
        required />
      <p><small v-show="invalid.hrid">工号格式有误</small></p>
      <label for="corpid">企业ID</label>
      <input
        v-model.lazy="corpid"
        :[invalidKey]="invalid.corpid"
        @change="checkCorpID"
        type="text"
        id="corpid"
        placeholder="请填写企业统一社会信用代码"
        required />
      <p>
        <small v-show="invalid.corpid">统一社会信用代码格式有误</small>
      </p>
      <label for="phone">电话</label>
      <input
        v-model.lazy="phone"
        :[invalidKey]="invalid.phone"
        @change="checkPhone"
        type="text"
        id="phone"
        placeholder="请输入手机号码"
        required />
      <p><small v-show="invalid.phone">手机号格式有误</small></p>
      <label for="code">验证码</label>
      <div class="grid">
        <input
          v-model.lazy="code"
          :[invalidKey]="invalid.code"
          @change="checkCode"
          type="text"
          id="code"
          placeholder="请输入验证码"
          required />
        <button
          :aria-busy="loading"
          :disabled="disabled"
          @click.prevent="sendCode"
          type="button">
          {{ buttonContent }}
        </button>
      </div>
      <p><small v-show="invalid.code">验证码有误</small></p>
      <button @click.prevent="submit" type="submit">完成</button>
    </article>
  </section>
</template>

<style scoped></style>
