import { createResource } from 'frappe-ui'

const API =
  'ouredu_fcrm_customizations.ouredu_fcrm_customizations.doctype.sales_agent.sales_agent'

export const notificationPreferences = createResource({
  url: `${API}.get_notification_preferences`,
  cache: 'notificationPreferences',
})

export const updateNotificationPreferences = createResource({
  url: `${API}.update_notification_preferences`,
  onSuccess: (data) => notificationPreferences.setData(data),
})
