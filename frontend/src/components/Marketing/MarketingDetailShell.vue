<template>
  <LayoutHeader v-if="document.doc">
    <template #left-header>
      <Breadcrumbs :items="breadcrumbs" />
    </template>
    <template #right-header>
      <slot name="actions" />
    </template>
  </LayoutHeader>
  <div v-if="document.doc" class="flex h-full overflow-hidden">
    <Tabs
      v-model="tabIndex"
      :tabs="tabs"
      class="flex flex-1 overflow-hidden flex-col [&_[role='tab']]:px-0 [&_[role='tab']]:shrink-0 [&_[role='tablist']]:px-5 [&_[role='tablist']::-webkit-scrollbar]:h-0 [&_[role='tablist']]:min-h-[45px] [&_[role='tabpanel']:not([hidden])]:flex [&_[role='tabpanel']:not([hidden])]:grow"
    >
      <template #tab-panel>
        <div class="flex flex-1 flex-col overflow-y-auto">
          <div v-if="tabs[tabIndex]?.name === 'Details'" class="px-3 sm:px-10">
            <DataFields :doctype="config.doctype" :docname="docname" />
          </div>
          <slot v-else name="tab" :tab="tabs[tabIndex]?.name" />
        </div>
      </template>
    </Tabs>
    <Resizer class="flex flex-col border-l overflow-y-auto" side="right">
      <div class="flex flex-col gap-1 border-b p-5">
        <div class="text-lg font-semibold text-ink-gray-9 truncate">
          {{ title }}
        </div>
        <div class="text-sm text-ink-gray-5 truncate">{{ docname }}</div>
      </div>
      <div class="flex flex-col gap-3 p-5 text-base">
        <slot name="side" />
      </div>
    </Resizer>
  </div>
  <ErrorPage v-else-if="document.get.error" errorTitle="Not Found" :errorMessage="String(document.get.error)" />
</template>
<script setup>
// Layout of the Marketing Workflow detail pages: breadcrumbs back to the list,
// action buttons, tabs (the page's own tabs + "Details" with the doctype's fields)
// and a side panel, like the CRM's other document pages.
import LayoutHeader from '@/components/LayoutHeader.vue'
import Resizer from '@/components/Resizer.vue'
import DataFields from '@/components/Activities/DataFields.vue'
import ErrorPage from '@/components/ErrorPage.vue'
import { marketing } from '@/components/Marketing/marketing'
import { useActiveTabManager } from '@/composables/useActiveTabManager'
import { getSettings } from '@/stores/settings'
import { Breadcrumbs, Tabs, usePageMeta } from 'frappe-ui'
import { computed } from 'vue'

const props = defineProps({
  entity: { type: String, required: true },
  docname: { type: String, required: true },
  // createDocumentResource of the page (from useDocument)
  document: { type: Object, required: true },
  // [{ name, label, icon?, count? }]; a "Details" tab is added last
  tabs: { type: Array, default: () => [] },
})

const config = marketing[props.entity]
const { brand } = getSettings()

const tabs = computed(() => [
  ...props.tabs,
  { name: 'Details', label: __('Details'), icon: 'list' },
])
const { tabIndex } = useActiveTabManager(tabs, `lastMarketing${props.entity}Tab`)

const title = computed(
  () => props.document.doc?.[config.titleField] || props.docname,
)

const breadcrumbs = computed(() => [
  { label: __(config.label), route: { name: config.listRoute } },
  {
    label: title.value,
    route: { name: config.docRoute, params: { [config.param]: props.docname } },
  },
])

usePageMeta(() => ({ title: title.value, icon: brand.favicon }))
</script>
