<template>
  <Popover trigger="hover" :hoverDelay="0.3" placement="bottom-start">
    <template #target>
      <div class="truncate" @mouseenter="loadContacts">
        <slot />
      </div>
    </template>
    <template #body-main>
      <div class="w-72 max-h-80 overflow-auto p-2">
        <div
          v-if="loading"
          class="px-2 py-3 text-sm text-ink-gray-5"
        >
          {{ __('Loading...') }}
        </div>
        <template v-else-if="flat">
          <div
            v-if="!phones.length"
            class="px-2 py-3 text-sm text-ink-gray-5"
          >
            {{ __('No phone number') }}
          </div>
          <div
            v-for="phone in phones"
            :key="phone"
            class="flex items-center justify-between gap-2 rounded px-2 py-2 text-sm text-ink-gray-6 hover:bg-surface-gray-2"
          >
            <span class="truncate">{{ phone }}</span>
            <div class="flex shrink-0 items-center gap-2">
              <button
                type="button"
                class="text-ink-gray-5 hover:text-ink-gray-8"
                :title="__('Log a call')"
                @click.stop="openCallLog(phone)"
              >
                <FeatherIcon name="phone" class="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                class="text-ink-gray-5 hover:text-ink-gray-8"
                :title="__('Copy to clipboard')"
                @click.stop="copyToClipboard(phone)"
              >
                <FeatherIcon name="copy" class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </template>
        <template v-else>
          <div
            v-if="!contacts.length"
            class="px-2 py-3 text-sm text-ink-gray-5"
          >
            {{ __('No contacts found') }}
          </div>
          <div
            v-for="contact in contacts"
            :key="contact.name"
            class="flex items-start gap-2 rounded px-2 py-2 hover:bg-surface-gray-2"
          >
            <Avatar :image="contact.image" :label="contact.full_name" size="sm" />
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium text-ink-gray-8">
                {{ contact.full_name }}
              </div>
              <div
                v-if="!contact.phones.length"
                class="text-sm text-ink-gray-5"
              >
                {{ __('No phone number') }}
              </div>
              <div
                v-for="phone in contact.phones"
                :key="phone"
                class="flex items-center justify-between gap-2 text-sm text-ink-gray-6"
              >
                <span class="truncate">{{ phone }}</span>
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    class="text-ink-gray-5 hover:text-ink-gray-8"
                    :title="__('Log a call')"
                    @click.stop="openCallLog(phone)"
                  >
                    <FeatherIcon name="phone" class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    class="text-ink-gray-5 hover:text-ink-gray-8"
                    :title="__('Copy to clipboard')"
                    @click.stop="copyToClipboard(phone)"
                  >
                    <FeatherIcon name="copy" class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </Popover>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Popover, Avatar, FeatherIcon, call } from 'frappe-ui'
import { copyToClipboard } from '@/utils'
import { useDoctypeModal } from '@/composables/doctypeModal'

const props = defineProps({
  doctype: { type: String, required: true },
  docname: { type: String, required: true },
  flat: { type: Boolean, default: false },
})

const { showModal } = useDoctypeModal()

function openCallLog(phone) {
  showModal({
    doctype: 'CRM Call Log',
    title: 'Call Log',
    defaults: {
      type: 'Outgoing',
      to: phone,
      status: 'Completed',
    },
  })
}

const phones = computed(() => contacts.value[0]?.phones || [])

const loading = ref(false)
const loaded = ref(false)
const contacts = ref([])

async function loadContacts() {
  if (loaded.value || loading.value || !props.docname) return
  loading.value = true
  try {
    contacts.value = await call(
      'ouredu_fcrm_customizations.api.entity_contacts.get_contacts_with_numbers',
      { doctype: props.doctype, name: props.docname },
    )
    loaded.value = true
  } finally {
    loading.value = false
  }
}
</script>
