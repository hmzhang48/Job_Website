<script setup lang="ts">
import { ref } from "vue"
import { useModalStore } from "../stores/modalStore.js"
const modalStore = useModalStore()
let open = ref( false )
modalStore.$subscribe( ( _, state ) => {
  if ( state.modalState ) {
    const html = document.documentElement
    html.classList.add( "modal-is-open", "modal-is-opening" )
    setTimeout( () => {
      html.classList.remove( "modal-is-opening" )
    }, 400 )
    open.value = true
  } else {
    const html = document.documentElement
    html.classList.add( "modal-is-closing" )
    setTimeout( () => {
      html.classList.remove( "modal-is-open", "modal-is-closing" )
      state.message = ""
      state.footerState = false
      open.value = false
    }, 400 )
  }
} )
const setState = ( value: boolean ) => {
  modalStore.$patch( ( state ) => {
    state.modalState = false
    state.confirmState = value
  } )
}
</script>

<template>
  <dialog id="modal" :open=" open ">
    <article>
      <header>
        <a href="#close" aria-label="Close" class="close" data-target="modal" @click.prevent="setState( false )">
        </a>
        <strong>请注意</strong>
      </header>
      <p>
        <slot></slot>
      </p>
      <footer v-if=" modalStore.footerState ">
        <a href="#confirm" role="button" data-target="modal" @click.prevent="setState( true )">
          确认
        </a>
        <a href="#withdraw" role="button" data-target="modal" @click.prevent="setState( false )">
          取消
        </a>
      </footer>
    </article>
  </dialog>
</template>

<style scoped>
</style>
