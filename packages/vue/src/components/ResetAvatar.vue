<script setup lang="ts">
import { ref, watch, computed, inject } from "vue"
import { useModalStore } from "../stores/modalStore.js"
import { resetAvatar } from "../lib/connect.js"
import {
  useCanvas,
  loadImage,
  domain,
  infoKey,
  updateKey
} from "../lib/help.js"
const modalStore = useModalStore()
let info = inject( infoKey )
let update = inject( updateKey, () => { } )
let src = computed( () => {
  if ( info?.value.avatar ) {
    return `${ domain }/fastify/image/${ info.value.avatar }.png`
  } else {
    return ""
  }
} )
let origin = await loadImage( src.value )
let canvas = ref<HTMLCanvasElement>()
let image = await useCanvas( canvas, origin )
let newAvatar = ref<File>()
let avatarInput = ref<HTMLInputElement>()
let invalid = ref( false )
watch( newAvatar, async () => {
  if ( newAvatar.value ) {
    image.value = await loadImage( newAvatar.value )
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
const submit = async () => {
  const avatar = await getAvatar()
  const formData = new FormData()
  formData.append( "avatar", avatar )
  const fileName = await resetAvatar( formData, info?.value.avatar )
  if ( fileName ) {
    modalStore.showModel( "头像上传成功" )
    update( "avatar", fileName )
  } else {
    modalStore.showModel( "请重试" )
  }
}
const checkAvatar = async () => {
  const file = avatarInput.value?.files?.[ 0 ]
  if ( file && file.size < 102400 ) {
    newAvatar.value = file
  } else {
    invalid.value = true
  }
}
</script>

<template>
  <article>
    <label for="avatar">头像</label>
    <div class="grid">
      <div>
        <input type="file" accept="image/*" id="avatar" ref="avatarInput" @change=" checkAvatar " />
        <p>
          <small v-show=" invalid ">头像图片需小于100KB</small>
        </p>
        <button @click.prevent=" submit " type="submit">上传</button>
      </div>
      <canvas width="128" height="128" id="canvas" ref="canvas"></canvas>
    </div>
  </article>
</template>

<style scoped>
</style>
