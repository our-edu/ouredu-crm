<template>
  <div class="flex w-full items-center justify-between gap-1">
    <div class="flex items-stretch space-x-2">
      <div>
        <CalendarIcon class="size-4 text-cyan-500" />
      </div>
      <div class="flex flex-col text-base">
        <div class="font-medium text-ink-gray-8 mb-1">
          {{ event.subject || __('Event Notification') }}
        </div>
        <div class="text-ink-gray-6">
          {{ formatEventTime() }}
        </div>
      </div>
    </div>
    <MultipleAvatar
      v-if="participants.length > 0"
      :avatars="participants"
      size="md"
    />
  </div>
</template>

<script setup>
import { usersStore } from '@/stores/users'
import { dayjs } from 'frappe-ui'
import { computed } from 'vue'

const props = defineProps({
  event: { type: Object, required: true },
})

const { getUser } = usersStore()

const participants = computed(() => {
  const emails = [...(props.event.event_participants || [])]
  if (!emails.length) return []

  if (props.event.owner && !emails.includes(props.event.owner)) {
    emails.push(props.event.owner)
  }

  return emails.map((p) => ({
    label: getUser(p).full_name || p,
    image: getUser(p).user_image || '',
    name: p,
  }))
})

function formatEventTime() {
  if (props.event.all_day_event) {
    return __('All Day')
  } else if (props.event.starts_on) {
    const startTime = dayjs(props.event.starts_on).format('h:mm a')
    const endTime = dayjs(props.event.ends_on).format('h:mm a')
    return `${startTime} - ${endTime}`
  }
  return ''
}
</script>
