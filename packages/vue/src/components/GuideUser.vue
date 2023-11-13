<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import { validPhone, uploadImage, postUserInfo } from "../lib/connect.js"
import {
  initProvince,
  initCity,
  initArea,
  useCanvas,
  loadImage
} from "../lib/help.js"
const invalidKey = "aria-invalid"
let invalid = ref<Record<string, boolean>>( {} )
let name = ref( "" )
const checkName = () => {
  if ( name.value === "" ) {
    invalid.value.name = true
  } else {
    invalid.value.name = false
  }
}
let initial = await loadImage( "./vue.svg" )
let canvas = ref<HTMLCanvasElement>()
let image = await useCanvas( canvas, initial )
let avatar = ref<File>()
let avatarInput = ref<HTMLInputElement>()
watch( avatar, async () => {
  if ( avatar.value ) {
    image.value = await loadImage( avatar.value )
  }
} )
const getAvatar = () => {
  return new Promise( ( resolve: ( value: File ) => void ) => {
    canvas.value?.toBlob( ( blob ) => {
      if ( blob ) {
        resolve( new File( [ blob ], "avatar.png", { type: "image/png" } ) )
      }
    } )
  } )
}
const checkAvatar = async () => {
  const file = avatarInput.value?.files?.[ 0 ]
  if ( file && file.size < 102400 ) {
    avatar.value = file
    invalid.value.avatar = false
  } else {
    if ( !avatar.value ) {
      invalid.value.avatar = true
    }
  }
}
let id = ref( "" )
const idRegex = new RegExp( /^\d{17}([0-9]|X|x)$/ )
const checkID = () => {
  if ( !idRegex.test( id.value ) ) {
    invalid.value.id = true
  } else {
    invalid.value.id = false
  }
}
let provinceSelect = ref<HTMLSelectElement>()
let citySelect = ref<HTMLSelectElement>()
let areaSelect = ref<HTMLSelectElement>()
onMounted( () => {
  initProvince( provinceSelect.value )
} )
const addCity = () => {
  initCity( provinceSelect.value, citySelect.value, areaSelect.value )
  area.value = "area"
  checkArea()
}
const addArea = () => {
  initArea( citySelect.value, areaSelect.value )
  area.value = "area"
  checkArea()
}
let area = ref( "area" )
const checkArea = () => {
  if ( area.value === "area" ) {
    invalid.value.area = true
  } else {
    invalid.value.area = false
  }
}
let phone = ref( "" )
const phoneRegex = new RegExp( /^\d{11}$/ )
const checkPhone = () => {
  resetCode()
  if ( phoneRegex.test( phone.value ) ) {
    invalid.value.phone = false
  } else {
    invalid.value.phone = true
  }
}
let loading = ref( false )
let validCode: string | null
const sendCode = async () => {
  if ( invalid.value.phone === false ) {
    loading.value = true
    validCode = await validPhone( phone.value )
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
const checkCode = () => {
  if ( code.value === validCode ) {
    invalid.value.code = false
  } else {
    invalid.value.code = true
  }
}
const resetCode = () => {
  validCode = null
  if ( code.value !== "" ) {
    code.value = ""
    invalid.value.code = true
  }
}
const keys = [ "name", "id", "area", "phone", "code" ]
const check = () => {
  let result = true
  for ( let key of keys ) {
    if ( invalid.value[ key ] === undefined ) {
      invalid.value[ key ] = true
    }
  }
  for ( let key in invalid.value ) {
    if ( invalid.value[ key ] && result ) {
      result = false
    }
  }
  return result
}
const emits = defineEmits<{
  guide: []
}>()
const submit = async () => {
  const result = check()
  if ( result ) {
    let result = false
    const avatar = await getAvatar()
    const formData = new FormData()
    formData.append( "avatar", avatar )
    const fileName = await uploadImage( formData )
    if ( fileName ) {
      const userInfo = {
        name: name.value,
        avatar: fileName,
        id: id.value,
        location: area.value,
        phone: phone.value
      }
      result = await postUserInfo( userInfo )
    }
    if ( result ) {
      emits( "guide" )
    }
  }
}
</script>

<template>
  <section>
    <article>
      <h1>请先完善个人基本信息</h1>
      <label for="name">姓名</label>
      <input v-model.lazy=" name " :[invalidKey]=" invalid.name " @change=" checkName " type="text" id="name"
        placeholder="请输入真实姓名" required />
      <p><small v-show=" invalid.name ">姓名格式有误</small></p>
      <label for="avatar">头像</label>
      <div class="grid">
        <div>
          <input type="file" accept="image/*" id="avatar" ref="avatarInput" @change=" checkAvatar " />
          <p>
            <small v-show=" invalid.avatar ">头像图片需小于100KB</small>
          </p>
        </div>
        <canvas width="128" height="128" id="canvas" ref="canvas"></canvas>
      </div>
      <label for="id">身份证号</label>
      <input v-model.lazy=" id " :[invalidKey]=" invalid.id " @change=" checkID " type="text" id="id" placeholder="请输入身份证号"
        required />
      <p><small v-show=" invalid.id ">身份证号格式有误</small></p>
      <fieldset>
        <legend>居住地</legend>
        <div class="grid">
          <select :[invalidKey]=" invalid.area " id="province" ref="provinceSelect" @change=" addCity ">
            <option value="province" selected>省(直辖市)</option>
          </select>
          <select :[invalidKey]=" invalid.area " id="city" ref="citySelect" @change=" addArea ">
            <option value="city" selected>市</option>
          </select>
          <select v-model.lazy=" area " :[invalidKey]=" invalid.area " id="area" ref="areaSelect" @change=" checkArea ">
            <option value="area" selected>区(县)</option>
          </select>
        </div>
        <p><small v-show=" invalid.area ">居住地未选择</small></p>
      </fieldset>
      <label for="phone">电话</label>
      <input v-model.lazy=" phone " :[invalidKey]=" invalid.phone " @change=" checkPhone " type="text" id="phone"
        placeholder="请输入手机号码" required />
      <p><small v-show=" invalid.phone ">手机号格式有误</small></p>
      <label for="code">验证码</label>
      <div class="grid">
        <input v-model.lazy=" code " :[invalidKey]=" invalid.code " @change=" checkCode " type="text" id="code"
          placeholder="请输入验证码" required />
        <button :aria-busy=" loading " :disabled=" disabled " @click.prevent=" sendCode " type="button">
          {{ buttonContent }}
        </button>
      </div>
      <p><small v-show=" invalid.code ">验证码有误</small></p>
      <button @click.prevent=" submit " type="submit">完成</button>
    </article>
  </section>
</template>

<style scoped>
</style>
