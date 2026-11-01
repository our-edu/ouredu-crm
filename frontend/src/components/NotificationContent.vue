<!-- eslint-disable vue/no-v-html -->
<template>
  <div>
    <div
      v-if="notification.notification_text"
      v-html="sanitizeHTML(notification.notification_text)"
    />
    <div v-else class="mb-2 space-x-1 leading-5 text-ink-gray-5">
      <span class="font-medium text-ink-gray-9">
        {{ notification.from_user.full_name }}
      </span>
      <span>
        {{ __('mentioned you in {0}', [notification.reference_doctype]) }}
      </span>
      <span class="font-medium text-ink-gray-9">
        {{ notification.reference_name }}
      </span>
    </div>
    <div class="text-sm text-ink-gray-5">
      {{ relativeTime }}
    </div>
  </div>
</template>
<script setup>
import { timeAgo, sanitizeHTML } from '@/utils'
import { useSharedNow } from '@/composables/useSharedNow'
import { computed } from 'vue'

const props = defineProps({
  notification: { type: Object, required: true },
})

const now = useSharedNow()

// Reading now.value makes the text refresh on every tick
const relativeTime = computed(
  () => now.value && __(timeAgo(props.notification.creation)),
)
</script>
