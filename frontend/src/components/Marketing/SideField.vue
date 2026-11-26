<template>
  <div class="flex flex-col gap-1">
    <div class="text-sm text-ink-gray-5">{{ label }}</div>
    <div class="text-base text-ink-gray-9 break-words">
      <slot>{{ value ?? '-' }}</slot>
    </div>
  </div>
</template>
<script setup>
// A label / value pair in a Marketing page's side panel
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: null },
})
</script>
