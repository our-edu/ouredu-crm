import {
  notifications,
  notificationsStore,
  getNotificationRoute,
} from '@/stores/notifications'
import { notificationPreferences } from '@/stores/notificationPreferences'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Queue of popup cards for notifications that arrive while the app is open.
 * The first load only marks existing notifications as seen, so old ones
 * never pop up.
 */
export function useNotificationPopups() {
  const router = useRouter()
  const { mark_as_read } = notificationsStore()
  const popups = ref([])
  const seen = new Set()
  let seeded = false
  const sound = new Audio('/assets/frappe/sounds/chime.mp3')

  const preferences = computed(() => notificationPreferences.data?.values)

  notificationPreferences.fetch()

  watch(() => notifications.data, queueNewNotifications, { immediate: true })

  function queueNewNotifications(list) {
    if (!notifications.fetched || !list) return

    const fresh = list.filter((n) => !seen.has(n.name))
    fresh.forEach((n) => seen.add(n.name))

    if (!seeded) {
      seeded = true
      return
    }
    const unread = fresh.filter((n) => !n.read)
    if (!unread.length) return

    // The sound plays even when popups are disabled
    playSound()
    if (!preferences.value?.enable_notification_popups) return

    // list is newest first; add oldest first so the newest ends up first
    unread.reverse().forEach(addPopup)
  }

  function playSound() {
    // Browsers block audio until the user has interacted with the page
    sound.currentTime = 0
    sound.play().catch(() => {})
  }

  function addPopup(notification) {
    const popup = reactive({
      key: notification.name,
      notification,
      hovered: false,
      expired: false,
      timer: null,
    })
    popups.value.unshift(popup)

    if (preferences.value.vanish_behavior === 'After time') {
      popup.timer = setTimeout(() => {
        popup.expired = true
        if (!popup.hovered) removePopup(popup)
      }, preferences.value.after_time_duration * 1000)
    }
  }

  function removePopup(popup) {
    clearTimeout(popup.timer)
    popups.value = popups.value.filter((p) => p.key !== popup.key)
  }

  function onMouseEnter(popup) {
    popup.hovered = true
  }

  function onMouseLeave(popup) {
    popup.hovered = false
    if (preferences.value?.vanish_behavior !== 'After time' || popup.expired) {
      removePopup(popup)
    }
  }

  function openPopup(popup) {
    const { notification } = popup
    removePopup(popup)
    markAsRead(notification)

    const route = getNotificationRoute(notification)
    if (route) navigate(route)
  }

  function navigate(route) {
    if (preferences.value?.open_notifications_in_new_tab) {
      window.open(router.resolve(route).href, '_blank')
    } else {
      router.push(route)
    }
  }

  function markAsRead(notification) {
    // mark_as_read marks every notification as read when doc is empty
    const doc = notification.comment || notification.notification_type_doc
    if (doc) mark_as_read.submit({ doc })
  }

  return {
    popups,
    removePopup,
    onMouseEnter,
    onMouseLeave,
    openPopup,
    navigate,
  }
}
