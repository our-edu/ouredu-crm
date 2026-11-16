import { createResource } from 'frappe-ui'
import { computed, ref } from 'vue'
import { usersStore } from '@/stores/users'

export const whatsappEnabled = ref(false)
export const isWhatsappInstalled = ref(false)

// WhatsApp is enabled and the session user has the "WhatsApp Manager" role.
// Use it to show the WA Leads page and the WhatsApp tabs.
export const canUseWhatsApp = computed(
  () => whatsappEnabled.value && usersStore().isWhatsAppManager(),
)

createResource({
  url: 'crm.api.whatsapp.is_whatsapp_enabled',
  cache: 'Is Whatsapp Enabled',
  auto: true,
  onSuccess: (data) => {
    whatsappEnabled.value = Boolean(data)
  },
})

createResource({
  url: 'crm.api.whatsapp.is_whatsapp_installed',
  cache: 'Is Whatsapp Installed',
  auto: true,
  onSuccess: (data) => {
    isWhatsappInstalled.value = Boolean(data)
  },
})
