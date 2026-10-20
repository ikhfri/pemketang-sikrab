<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import SiteHeader from "./components/SiteHeader.vue";
import SiteFooter from "./components/SiteFooter.vue";

const route = useRoute();
const showChrome = computed(() => !["/admin", "/admin/results"].includes(route.path));
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <SiteHeader v-if="showChrome" />
    <RouterView />
    <SiteFooter v-if="showChrome && route.path !== '/thanks'" />
  </div>
</template>
