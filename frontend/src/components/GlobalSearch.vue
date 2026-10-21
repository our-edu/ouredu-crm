<template>
  <Dialog v-model="show" :options="{ size: 'xl', position: 'top' }" @after-leave="reset">
    <template #body>
      <div>
        <div class="relative flex items-center border-b border-outline-gray-modals">
          <FeatherIcon
            name="search"
            class="pointer-events-none absolute left-4.5 h-4 w-4 text-ink-gray-5"
          />
          <input
            ref="inputRef"
            v-model="searchQuery"
            type="text"
            autocomplete="off"
            :placeholder="__('Search contacts, organizations, leads, deals...')"
            class="w-full border-none bg-transparent py-3 pl-11.5 pr-4.5 text-base text-ink-gray-8 placeholder-ink-gray-4 focus:ring-0"
          />
        </div>
        <div class="max-h-96 overflow-auto">
          <div
            v-for="group in groups"
            :key="group.key"
            class="mb-2 mt-4.5 first:mt-3"
          >
            <div class="mb-2.5 px-4.5 text-base text-ink-gray-5">
              {{ group.title }}
            </div>
            <RouterLink
              v-for="item in group.items"
              :key="`${item.doctype}:${item.name}`"
              :to="item.to"
              class="flex w-full items-center rounded px-4.5 py-2 text-left text-base font-medium text-ink-gray-8 hover:bg-surface-gray-3"
              @click="closeSearch"
            >
              <component
                :is="group.icon"
                v-if="group.icon"
                class="mr-3 h-4 w-4 flex-shrink-0 text-ink-gray-7"
              />
              <span class="overflow-hidden text-ellipsis whitespace-nowrap">
                {{ item.title }}
              </span>
            </RouterLink>
          </div>
          <div
            v-if="searchQuery.trim() && !groups.length && !isSearching"
            class="px-4.5 py-6 text-center text-base text-ink-gray-5"
          >
            {{ __('No results found') }}
          </div>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Dialog, FeatherIcon, call } from 'frappe-ui'
import { useDebounceFn } from '@vueuse/core'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import ContactsIcon from '@/components/Icons/ContactsIcon.vue'
import OrganizationsIcon from '@/components/Icons/OrganizationsIcon.vue'
import LeadsIcon from '@/components/Icons/LeadsIcon.vue'
import DealsIcon from '@/components/Icons/DealsIcon.vue'

const show = defineModel('show', { default: false })

const inputRef = ref(null)
const searchQuery = ref('')
const isSearching = ref(false)
const results = ref({ contacts: [], organizations: [], leads: [], deals: [] })

const GROUP_DEFS = [
  { key: 'contacts', title: __('Contacts'), icon: ContactsIcon },
  { key: 'organizations', title: __('Organizations'), icon: OrganizationsIcon },
  { key: 'leads', title: __('Leads'), icon: LeadsIcon },
  { key: 'deals', title: __('Deals'), icon: DealsIcon },
]

const ROUTES = {
  Contact: (name) => ({ name: 'Contact', params: { contactId: name } }),
  'CRM Organization': (name) => ({
    name: 'Organization',
    params: { organizationId: name },
  }),
  'CRM Lead': (name) => ({ name: 'Lead', params: { leadId: name } }),
  'CRM Deal': (name) => ({ name: 'Deal', params: { dealId: name } }),
}

const groups = computed(() => {
  return GROUP_DEFS.map(({ key, title, icon }) => ({
    key,
    title,
    icon,
    items: (results.value[key] || []).map((item) => ({
      ...item,
      to: ROUTES[item.doctype]?.(item.name),
    })),
  })).filter((group) => group.items.length)
})

// Tracks the most recently *sent* search request. If several requests end up
// in flight at once (e.g. a pause mid-typing fires an earlier, broader
// search before the user finishes), responses can arrive out of order - an
// older, slower request can resolve after a newer one. Only the response
// matching the latest sent request is ever applied; anything else is
// dropped, regardless of when it arrives.
let latestRequestId = 0

const runSearch = useDebounceFn(async (query) => {
  if (!query || !query.trim()) {
    latestRequestId += 1
    results.value = { contacts: [], organizations: [], leads: [], deals: [] }
    isSearching.value = false
    return
  }

  const requestId = ++latestRequestId
  try {
    const response = await call(
      'ouredu_fcrm_customizations.api.global_search.search',
      { query },
    )
    if (requestId !== latestRequestId) return
    results.value = response
  } finally {
    if (requestId === latestRequestId) {
      isSearching.value = false
    }
  }
}, 500)

watch(searchQuery, (query) => {
  if (query && query.trim()) {
    isSearching.value = true
  }
  runSearch(query)
})

function reset() {
  searchQuery.value = ''
  results.value = { contacts: [], organizations: [], leads: [], deals: [] }
}

watch(show, (isOpen) => {
  if (isOpen) {
    nextTick(() => inputRef.value?.focus())
  }
})

function closeSearch() {
  show.value = false
}

useKeyboardShortcuts({
  shortcuts: [
    {
      match: (e) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k',
      action: () => (show.value = true),
    },
  ],
  ignoreTyping: false,
  skipWhenDialogOpen: false,
})

defineExpose({ open: () => (show.value = true) })
</script>
