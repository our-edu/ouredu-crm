import { defineStore } from 'pinia'
import { createResource } from 'frappe-ui'
import { computed, ref } from 'vue'

export const visible = ref(false)

export const notifications = createResource({
  url: 'crm.api.notifications.get_notifications',
  initialData: [],
  auto: true,
})

const ROUTE_PARAM_KEYS = {
  Lead: 'leadId',
  Deal: 'dealId',
  Organization: 'organizationId',
  Contact: 'contactId',
}

export function getNotificationRoute(notification) {
  const paramKey = ROUTE_PARAM_KEYS[notification.route_name]
  if (!paramKey) return null

  return {
    name: notification.route_name,
    params: { [paramKey]: notification.reference_name },
    hash: notification.hash,
  }
}

export const unreadNotificationsCount = computed(
  () => notifications.data?.filter((n) => !n.read).length || 0,
)

export const notificationsStore = defineStore('crm-notifications', () => {
  const mark_as_read = createResource({
    url: 'crm.api.notifications.mark_as_read',
    onSuccess: () => {
      mark_as_read.params = {}
      notifications.reload()
    },
  })

  function toggle() {
    visible.value = !visible.value
  }

  function mark_doc_as_read(doc) {
    mark_as_read.params = { doc: doc }
    mark_as_read.reload()
    toggle()
  }

  return {
    unreadNotificationsCount,
    mark_as_read,
    mark_doc_as_read,
    toggle,
  }
})
