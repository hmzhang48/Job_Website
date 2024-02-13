<script setup lang="ts">
  import { ref, watch, onMounted } from "vue"
  import { validPhone, uploadImage, postUserInfo } from "../lib/connect.ts"
  import {
    initProvince,
    initCity,
    initArea,
    useCanvas,
    loadImage,
  } from "../lib/help.ts"
  const emits = defineEmits<{
    guide: []
  }>()
  const invalidKey = "aria-invalid"
  let invalid = ref<Record<string, boolean>>({})
  let name = ref("")
  const checkName = () => {
    invalid.value["name"] = name.value === "" ? true : false
  }
  let initial = await loadImage("./vue.svg")
  let canvas = ref<HTMLCanvasElement>()
  let image = await useCanvas(canvas, initial)
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
      invalid.value["avatar"] = false
    } else {
      if (!avatar.value) {
        invalid.value["avatar"] = true
      }
    }
  }
  let id = ref("")
  const idRegex = new RegExp(/^\d{17}([\dXx])$/)
  const checkID = () => {
    invalid.value["id"] = idRegex.test(id.value) ? false : true
  }
  let provinceSelect = ref<HTMLSelectElement>()
  let citySelect = ref<HTMLSelectElement>()
  let areaSelect = ref<HTMLSelectElement>()
  onMounted(() => {
    initProvince(provinceSelect.value)
  })
  const addCity = () => {
    initCity(provinceSelect.value, citySelect.value, areaSelect.value)
    area.value = "area"
    checkArea()
  }
  const addArea = () => {
    initArea(citySelect.value, areaSelect.value)
    area.value = "area"
    checkArea()
  }
  let area = ref("area")
  const checkArea = () => {
    invalid.value["area"] = area.value === "area" ? true : false
  }
  let phone = ref("")
  const phoneRegex = new RegExp(/^\d{11}$/)
  const checkPhone = () => {
    resetCode()
    invalid.value["phone"] = phoneRegex.test(phone.value) ? false : true
  }
  let loading = ref(false)
  let validCode: string
  const sendCode = async () => {
    if (invalid.value["phone"] === false) {
      loading.value = true
      validCode = await validPhone(phone.value)
      loading.value = false
      if (validCode !== "") {
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
    validCode = ""
    if (code.value !== "") {
      code.value = ""
      invalid.value["code"] = true
    }
  }
  const keys = ["name", "id", "area", "phone", "code"]
  const check = () => {
    let result = true
    for (let key of keys) {
      if (invalid.value[key] === undefined) {
        invalid.value[key] = true
      }
    }
    for (let key in invalid.value) {
      if (invalid.value[key] && result) {
        result = false
      }
    }
    return result
  }
  const submit = async () => {
    const result = check()
    if (result) {
      let result = false
      const avatar = await getAvatar()
      const formData = new FormData()
      formData.append("avatar", avatar)
      const fileName = await uploadImage(formData)
      if (fileName) {
        const userInfo = {
          name: name.value,
          avatar: fileName,
          id: id.value,
          location: area.value,
          phone: phone.value,
        }
        result = await postUserInfo(userInfo)
      }
      if (result) {
        emits("guide")
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
        :[invalidKey]="invalid['name']"
        v-model.lazy="name"
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
      <label for="id">身份证号</label>
      <input
        id="id"
        type="text"
        placeholder="请输入身份证号"
        required
        :[invalidKey]="invalid['id']"
        v-model.lazy="id"
        @change="checkID" />
      <p><small v-show="invalid['id']">身份证号格式有误</small></p>
      <fieldset>
        <legend>居住地</legend>
        <div class="grid">
          <select
            id="province"
            :[invalidKey]="invalid['area']"
            ref="provinceSelect"
            @change="addCity">
            <option
              value="province"
              selected>
              省(直辖市)
            </option>
          </select>
          <select
            id="city"
            :[invalidKey]="invalid['area']"
            ref="citySelect"
            @change="addArea">
            <option
              value="city"
              selected>
              市
            </option>
          </select>
          <select
            id="area"
            :[invalidKey]="invalid['area']"
            ref="areaSelect"
            v-model.lazy="area"
            @change="checkArea">
            <option
              value="area"
              selected>
              区(县)
            </option>
          </select>
        </div>
        <p><small v-show="invalid['area']">居住地未选择</small></p>
      </fieldset>
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
