<template>
  <div
    :id="activity.name"
    class="overflow-hidden rounded-md border border-l-[3px] border-outline-gray-modals bg-surface-cards"
    :class="mediumAccent"
  >
    <div class="flex items-center justify-stretch gap-2 px-3 py-2 text-base">
      <div class="inline-flex items-center flex-wrap gap-1 text-ink-gray-5">
        <UserAvatar class="mr-1" :user="activity.owner" size="md" />
        <span class="font-medium text-ink-gray-8">
          {{ getUser(activity.owner).full_name }}
        </span>
        <span>{{ __('contacted') }}</span>
        <template v-if="reference">
          <router-link
            v-if="reference.route"
            :to="reference.route"
            class="max-w-xs truncate font-medium text-ink-gray-8 hover:underline"
          >
            {{ reference.label }}
          </router-link>
          <span v-else class="max-w-xs truncate font-medium text-ink-gray-8">
            {{ reference.label }}
          </span>
        </template>
        <span>{{ __('via') }}</span>
        <span class="font-medium text-ink-gray-8">{{ mediumLabel }}</span>
        <span>{{ __('on') }}</span>
        <span class="font-medium text-ink-gray-8">
          {{ formatDate(activity.data.contacted_on) }}
        </span>
      </div>
      <div class="ml-auto whitespace-nowrap">
        <Tooltip :text="formatDate(activity.creation)">
          <div class="text-sm text-ink-gray-5">
            {{ __(timeAgo(activity.creation)) }}
          </div>
        </Tooltip>
      </div>
    </div>
    <div
      class="whitespace-pre-wrap break-words border-t border-outline-gray-modals bg-surface-gray-1 px-3 py-2 text-base leading-6 text-ink-gray-8"
    >
      {{ activity.data.summary }}
    </div>
  </div>
</template>
<script setup>
import UserAvatar from '@/components/UserAvatar.vue'
import { usersStore } from '@/stores/users'
import { Tooltip } from 'frappe-ui'
import { timeAgo, formatDate } from '@/utils'
import { computed } from 'vue'

const props = defineProps({
  activity: { type: Object, default: () => ({}) },
  // The document of the current page
  doctype: { type: String, default: '' },
  docname: { type: String, default: '' },
})

const { getUser } = usersStore()

const MEDIUM_LABELS = { Linkedin: 'LinkedIn', Whatsapp: 'WhatsApp' }

// Color of the left border, so the medium is visible at a glance
const MEDIUM_ACCENTS = {
  Linkedin: 'border-l-blue-500',
  Whatsapp: 'border-l-green-500',
}

const REFERENCE_PAGES = {
  'CRM Lead': { label: 'Lead', route: 'Lead', param: 'leadId' },
  'CRM Deal': { label: 'Deal', route: 'Deal', param: 'dealId' },
  Contact: { label: 'Contact', route: 'Contact', param: 'contactId' },
  'CRM Organization': {
    label: 'Organization',
    route: 'Organization',
    param: 'organizationId',
  },
}

const mediumLabel = computed(() => {
  const medium = props.activity.data.medium
  return MEDIUM_LABELS[medium] || medium
})

const mediumAccent = computed(
  () => MEDIUM_ACCENTS[props.activity.data.medium] || 'border-l-gray-400',
)

// The reference document, or null when it is the document of the current page
const reference = computed(() => {
  const { reference_doctype, reference_docname } = props.activity.data
  if (!reference_doctype || !reference_docname) return null
  if (
    reference_doctype === props.doctype &&
    reference_docname === props.docname
  ) {
    return null
  }

  const page = REFERENCE_PAGES[reference_doctype]
  return {
    label: `${__(page?.label || reference_doctype)}: ${reference_docname}`,
    route: page && {
      name: page.route,
      params: { [page.param]: reference_docname },
    },
  }
})
</script>
