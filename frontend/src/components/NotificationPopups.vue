<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      name="notification-popup"
      class="pointer-events-none fixed right-4 top-4 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] flex-col gap-2 overflow-y-auto overflow-x-hidden sm:bottom-4 sm:top-auto sm:w-96 sm:flex-col-reverse"
    >
      <div
        v-for="item in queue"
        :key="item.key"
        class="popup-card group pointer-events-auto relative flex w-full cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-base text-ink-gray-9 shadow-lg backdrop-blur-sm"
        :class="
          item.alert
            ? 'popup-card-event border-outline-blue-1'
            : 'popup-card-notification border-outline-green-2'
        "
        @mouseenter="item.popup && onMouseEnter(item.popup)"
        @mouseleave="item.popup && onMouseLeave(item.popup)"
        @click="openItem(item)"
      >
        <EventReminderContent
          v-if="item.alert"
          :event="item.alert.notification"
          class="pr-5"
        />
        <template v-else>
          <WhatsAppIcon
            v-if="item.popup.notification.type == 'WhatsApp'"
            class="size-7 shrink-0"
          />
          <UserAvatar
            v-else
            :user="item.popup.notification.from_user.name"
            size="lg"
            class="shrink-0"
          />
          <NotificationContent
            :notification="item.popup.notification"
            class="min-w-0 pr-5"
          />
        </template>
        <Button
          variant="ghost"
          class="absolute right-1.5 top-1.5 !size-6 !p-0 opacity-0 transition-opacity group-hover:opacity-100"
          :aria-label="__('Close')"
          @click.stop="closeItem(item)"
        >
          <FeatherIcon name="x" class="size-4 text-ink-gray-5" />
        </Button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import WhatsAppIcon from '@/components/Icons/WhatsAppIcon.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import NotificationContent from '@/components/NotificationContent.vue'
import EventReminderContent from '@/components/EventReminderContent.vue'
import { useNotificationPopups } from '@/composables/useNotificationPopups'
import { useEventNotificationAlert } from '@/data/notifications'
import { Button, dayjs, dayjsLocal } from 'frappe-ui'
import { computed } from 'vue'

const { popups, removePopup, onMouseEnter, onMouseLeave, openPopup, navigate } =
  useNotificationPopups()

const {
  eventNotificationAlerts,
  completeEventNotificationAlert,
  removeCompletedEventNotificationAlerts,
} = useEventNotificationAlert()

// Event reminders and notifications share one queue, sorted by creation
// time, newest first. A reminder is created when it is sent, so its arrival
// time is its creation time.
// Event reminders stay until closed or opened; they ignore vanish behavior.
const queue = computed(() => {
  const events = eventNotificationAlerts.value
    .filter((alert) => !alert.completed)
    .map((alert) => ({
      key: `event:${alert.id}`,
      createdAt: dayjs(alert.createdAt).valueOf(),
      alert,
    }))
  const notifications = popups.value.map((popup) => ({
    key: `notification:${popup.key}`,
    createdAt: dayjsLocal(popup.notification.creation).valueOf(),
    popup,
  }))
  return [...events, ...notifications].sort((a, b) => b.createdAt - a.createdAt)
})

function openItem(item) {
  if (item.popup) return openPopup(item.popup)

  const event = item.alert.notification
  completeAlert(item.alert.id)
  navigate({
    name: 'Calendar',
    query: {
      eventId: event.event_name,
      date: dayjs(event.starts_on).format('YYYY-MM-DD'),
    },
  })
}

function closeItem(item) {
  if (item.popup) removePopup(item.popup)
  else completeAlert(item.alert.id)
}

function completeAlert(id) {
  completeEventNotificationAlert(id)
  setTimeout(() => removeCompletedEventNotificationAlerts(), 300)
}
</script>

<style scoped>
.popup-card {
  transition: background-color 0.2s ease;
}

.popup-card-notification {
  background-color: color-mix(in srgb, var(--surface-green-1) 85%, transparent);
}

.popup-card-notification:hover {
  background-color: color-mix(in srgb, var(--surface-green-2) 95%, transparent);
}

.popup-card-event {
  background-color: color-mix(in srgb, var(--surface-blue-1) 85%, transparent);
}

.popup-card-event:hover {
  background-color: color-mix(in srgb, var(--surface-blue-2) 95%, transparent);
}

.notification-popup-enter-active,
.notification-popup-leave-active,
.notification-popup-move {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

/* Take the leaving card out of the flow so the others slide into place */
.notification-popup-leave-active {
  position: absolute;
}

.notification-popup-enter-from,
.notification-popup-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .notification-popup-enter-active,
  .notification-popup-leave-active,
  .notification-popup-move {
    transition: opacity 0.3s ease;
  }

  .notification-popup-enter-from,
  .notification-popup-leave-to {
    transform: none;
  }
}
</style>
