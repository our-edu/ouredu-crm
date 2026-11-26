<template>
  <MarketingDetailShell
    entity="pages"
    :docname="pageId"
    :document="page"
    :tabs="[{ name: 'Forms', label: __('Forms'), icon: 'clipboard', count: summary.data?.forms }]"
  >
    <template #actions>
      <Button
        variant="solid"
        :label="__('Fetch Forms')"
        :loading="fetching"
        @click="fetchForms"
      />
    </template>
    <template #tab="{ tab }">
      <RelatedList
        v-if="tab === 'Forms'"
        ref="forms"
        entity="forms"
        :filters="{ page: pageId }"
        :columns="[
          { label: __('Form'), key: 'form_name' },
          { label: __('Status'), key: 'status' },
          { label: __('Leads (Meta)'), key: 'leads_count' },
          { label: __('Evaluation Template'), key: 'evaluation_template' },
        ]"
      />
    </template>
    <template #side>
      <SideField :label="__('Page ID')" :value="page.doc.page_id" />
      <SideField :label="__('Enabled')" :value="page.doc.enabled ? __('Yes') : __('No')" />
      <SideField
        :label="__('Leadgen Webhook')"
        :value="page.doc.leadgen_webhook_subscribed ? __('Subscribed') : __('Not subscribed')"
      />
      <SideField :label="__('Lead Forms')" :value="summary.data?.forms" />
      <SideField
        :label="__('Forms with a Template')"
        :value="summary.data?.forms_with_template"
      />
      <SideField
        :label="__('Forms Synced At')"
        :value="page.doc.last_forms_synced_at && formatDate(page.doc.last_forms_synced_at)"
      />
    </template>
  </MarketingDetailShell>
</template>
<script setup>
// Marketing Workflow → Page (a Facebook Page that owns lead forms)
import MarketingDetailShell from '@/components/Marketing/MarketingDetailShell.vue'
import RelatedList from '@/components/Marketing/RelatedList.vue'
import SideField from '@/components/Marketing/SideField.vue'
import { marketingApi, runMarketingAction } from '@/components/Marketing/marketing'
import { useDocument } from '@/data/document'
import { formatDate } from '@/utils'
import { createResource } from 'frappe-ui'
import { ref } from 'vue'

const props = defineProps({ pageId: { type: String, required: true } })

const { document: page } = useDocument('Meta Page', props.pageId)
const summary = createResource({
  url: 'fcrm_meta_integration.fcrm_meta_integration.portal.get_page_summary',
  params: { page: props.pageId },
  auto: true,
})
const forms = ref(null)
const fetching = ref(false)

async function fetchForms() {
  fetching.value = true
  const result = await runMarketingAction({
    run: () => marketingApi('fetch_page_forms', { page: props.pageId }),
    success: (r) => __('Fetched {0} form(s).', [r?.total ?? 0]),
  })
  fetching.value = false
  if (result) {
    page.reload()
    summary.reload()
    forms.value?.reload()
  }
}
</script>
