<script setup lang="ts">
  import { ref, watch } from "vue"
  import { useUserStore } from "../stores/userStore.ts"
  import { validPhone } from "../lib/fetch/register.ts"
  import { uploadImage } from "../lib/fetch/image.ts"
  import { existCorp } from "../lib/fetch/corpinfo.ts"
  import { postHRInfo } from "../lib/fetch/hrinfo.ts"
  import { loadImage } from "../lib/help.ts"
  import { useCanvas } from "../lib/use.ts"
  import imgURL from "../assets/vue.svg"
  const userStore = useUserStore()
  const { getGuide } = userStore
  const id = defineModel<{
    hrID: string
    corpID: string
  }>({ required: true })
  const props = defineProps<{
    exist: boolean
  }>()
  watch(
    () => props.exist,
    async () => {
      if (props.exist) {
        const result = await upload()
        if (result) {
          getGuide()
        }
      }
    }
  )
  const emits = defineEmits<{
    modal: []
  }>()
  let invalid = ref<Record<string, boolean>>({})
  let name = ref("")
  const checkName = () => {
    invalid.value["name"] = name.value === "" ? true : false
  }
  let origin = await loadImage(imgURL)
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
    if (file && file.size < 1_024_000) {
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
    "i"
  )
  const checkCorpID = () => {
    invalid.value["corpID"] = corpIDRegex.test(corpID.value) ? false : true
  }
  let phone = ref("")
  const phoneRegex = new RegExp(/^\d{11}$/)
  const checkPhone = () => {
    resetCode()
    invalid.value["phone"] = phoneRegex.test(phone.value) ? false : true
  }
  let validCode = ""
  let disabled = ref(false)
  const sendCode = async () => {
    if (invalid.value["phone"] === false) {
      disabled.value = true
      countDown()
      validCode = await validPhone(phone.value)
    }
  }
  let wait = ref(60)
  const countDown = () => {
    const count = () => {
      if (wait.value > 0) {
        wait.value -= 1
        setTimeout(count, 1000)
      } else {
        disabled.value = false
        wait.value = 60
      }
    }
    count()
  }
  let code = ref("")
  const checkCode = () => {
    invalid.value["code"] =
      validCode !== "" && code.value === validCode ? false : true
  }
  const resetCode = () => {
    validCode = ""
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
        phone: phone.value
      }
      const result = await postHRInfo(hrInfo)
      return result
    } else {
      return false
    }
  }
  let loading = ref(false)
  const submit = async () => {
    const result = check()
    if (result) {
      loading.value = true
      let result = await existCorp(corpID.value)
      if (result) {
        result = await upload()
        if (result) {
          getGuide()
        }
      }
    } else {
      id.value.hrID = hrID.value
      id.value.corpID = corpID.value
      emits("modal")
    }
    loading.value = false
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
        :aria-invalid="invalid['name']"
        @change="checkName" />
      <small v-show="invalid['name']">姓名格式有误</small>
      <label for="avatar">头像</label>
      <div class="grid">
        <div>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            ref="avatarInput"
            @change="checkAvatar" />
          <small v-show="invalid['avatar']">头像图片需小于1MB</small>
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
        :aria-invalid="invalid['hrID']"
        v-model.lazy="hrID"
        @change="checkHRID" />
      <small v-show="invalid['hrID']">工号格式有误</small>
      <label for="corpID">企业ID</label>
      <input
        id="corpID"
        type="text"
        placeholder="请填写企业统一社会信用代码"
        required
        :aria-invalid="invalid['corpID']"
        v-model.lazy="corpID"
        @change="checkCorpID" />
      <small v-show="invalid['corpID']">统一社会信用代码格式有误</small>
      <label for="phone">电话</label>
      <input
        id="phone"
        type="text"
        placeholder="请输入手机号码"
        required
        :aria-invalid="invalid['phone']"
        v-model.lazy="phone"
        @change="checkPhone" />
      <small v-show="invalid['phone']">手机号格式有误</small>
      <label for="code">验证码</label>
      <fieldset role="group">
        <input
          id="code"
          type="text"
          placeholder="请输入验证码"
          required
          :aria-invalid="invalid['code']"
          v-model.lazy="code"
          @change="checkCode" />
        <input
          type="button"
          :value="disabled ? `${wait}秒后可重试` : '发送验证码'"
          :disabled="disabled"
          @click.prevent="sendCode" />
      </fieldset>
      <small v-show="invalid['code']">验证码有误</small>
      <div class="button">
        <button
          :aria-busy="loading"
          @click.prevent="submit">
          完成
        </button>
      </div>
    </article>
  </section>
</template>

<style scoped lang="scss">
  .button {
    display: flex;
    justify-content: center;
  }
</style>
