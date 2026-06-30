<script setup lang="ts">
import HelloWorld from "./components/HelloWorld.vue";
import { SpeedInsights } from "@vercel/speed-insights/vue";
import { Analytics } from "@vercel/analytics/next";
</script>

<template>
  <Analytics></Analytics>
  <SpeedInsights />
  <HelloWorld />
</template>
