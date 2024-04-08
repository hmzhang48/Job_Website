<script setup lang="ts">
  import { ref, watch } from "vue"
  import { storeToRefs } from "pinia"
  import { useModalStore } from "../stores/modalStore.ts"
  const modalStore = useModalStore()
  const { modalState, confirmState, message, footerState } =
    storeToRefs(modalStore)
  let open = ref(false)
  watch(modalState, () => {
    if (modalState.value) {
      const html = document.documentElement
      html.classList.add("modal-is-open", "modal-is-opening")
      setTimeout(() => {
        html.classList.remove("modal-is-opening")
      }, 400)
      open.value = true
    } else {
      const html = document.documentElement
      html.classList.add("modal-is-closing")
      setTimeout(() => {
        html.classList.remove("modal-is-open", "modal-is-closing")
        message.value = ""
        footerState.value = false
        open.value = false
      }, 400)
    }
  })
  const setState = (value: boolean) => {
    modalState.value = false
    confirmState.value = value
  }
</script>

<template>
  <dialog
    id="modal"
    :open="open">
    <article>
      <header>
        <a
          href="#close"
          class="close"
          aria-label="Close"
          data-target="modal"
          @click.prevent="setState(false)">
        </a>
        <strong>请注意</strong>
      </header>
      <p>
        <slot></slot>
      </p>
      <footer v-if="footerState">
        <a
          href="#confirm"
          role="button"
          data-target="modal"
          @click.prevent="setState(true)">
          确认
        </a>
        <a
          href="#withdraw"
          role="button"
          data-target="modal"
          @click.prevent="setState(false)">
          取消
        </a>
      </footer>
    </article>
  </dialog>
</template>

<style scoped lang="scss"></style>
