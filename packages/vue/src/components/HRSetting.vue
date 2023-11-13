<script setup lang="ts">
import { ref, inject } from "vue"
import { hrListKey } from "../lib/help"
let hrs = inject( hrListKey )
let verify = ref( false )
</script>

<template>
  <aside>
    <article>
      <p>个人信息</p>
      <nav>
        <ul>
          <li @click.prevent="verify = false">HR管理</li>
          <li>企业认证</li>
        </ul>
      </nav>
    </article>
  </aside>
  <article v-if=" !verify ">
    <h1>企业HR列表</h1>
    <div v-if=" hrs?.length ">
      <ul v-for=" hr  of  hrs " :key=" hr.hrID ">
        <li>姓名：{{ hr.name }} 工号：{{ hr.hrID }}</li>
      </ul>
    </div>
    <p v-else>暂无其他HR</p>
  </article>
</template>

<style scoped>
</style>
