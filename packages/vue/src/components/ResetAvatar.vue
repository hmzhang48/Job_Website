<script setup lang="ts">
  import { ref, watch, inject, useTemplateRef } from 'vue'
  import { resetAvatar } from '../lib/fetch/image.ts'
  import { loadImage } from '../lib/help.ts'
  import { useCanvas } from '../lib/use.ts'
  import { infoKey, updateKey } from '../lib/inject.ts'
  import { useModalStore } from '../stores/modalStore.ts'
  import imgURL from '../assets/vue.svg'
  const modalStore = useModalStore()
  const { showModel } = modalStore
  let info = inject( infoKey )
  let update = inject( updateKey, () => ( {} ) )
  const initial = await loadImage( imgURL )
  let canvas = useTemplateRef( 'canvas' )
  let image = useCanvas( canvas, initial )
  let newAvatar = ref<File>()
  watch(
    newAvatar,
    async () =>
    {
      if ( newAvatar.value )
        image.value = await loadImage( newAvatar.value )
    }
  )
  let avatarInput = useTemplateRef( 'avatarInput' )
  let invalid = ref( false )
  const checkAvatar = () =>
  {
    const file = avatarInput.value?.files?.[ 0 ]
    invalid.value = !( file && file.size < 1_024_000 )
    newAvatar.value = invalid.value ? undefined : file
  }
  const getAvatar = () =>
  {
    return new Promise(
      ( resolve: ( value: File ) => void ) =>
      {
        canvas.value?.toBlob(
          ( blob ) =>
          {
            if ( blob )
              resolve( new File( [ blob ], 'avatar.png', { type: 'image/png' } ) )
          }
        )
      }
    )
  }
  let loading = ref( false )
  const submit = async () =>
  {
    if ( info?.value[ 'avatar' ] )
    {
      loading.value = true
      const avatar = await getAvatar()
      const formData = new FormData()
      formData.append( 'avatar', avatar )
      const fileName = await resetAvatar( formData, info.value[ 'avatar' ] )
      if ( fileName )
      {
        showModel( '头像上传成功' )
        update( 'avatar', fileName )
      }
      else
        showModel( '请重试' )
      loading.value = false
    }
  }
</script>

<template>
  <article>
    <div class="grid">
      <div>
        <input
          id="avatar"
          ref="avatarInput"
          type="file"
          accept="image/*"
          @change=" checkAvatar "
        >
        <small v-show=" invalid ">头像图片需小于1MB</small>
        <div class="button">
          <button
            :aria-busy=" loading "
            @click.prevent=" submit "
          >
            上传
          </button>
        </div>
      </div>
      <canvas
        id="canvas"
        ref="canvas"
        width="128"
        height="128"
      />
    </div>
  </article>
</template>

<style scoped lang="scss">
  .grid {
    grid-template-columns: 1fr max-content;
    gap: 10px;
  }

  .button {
    display: flex;
    justify-content: center;
  }
</style>