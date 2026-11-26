<template>
  <MarketingDetailShell
    entity="forms"
    :docname="formId"
    :document="form"
    :tabs="[
      { name: 'Leads', label: __('Leads'), icon: 'user-plus', count: summary.data?.leads },
      { name: 'Questions', label: __('Questions'), icon: 'help-circle', count: summary.data?.questions?.length },
    ]"
  >
    <template #actions>
      <Button
        v-if="form.doc.evaluation_template"
        :label="__('Evaluation Template')"
        @click="openTemplate(form.doc.evaluation_template)"
      />
      <Button
        v-if="form.doc.evaluation_template"
        :label="__('Re-evaluate Leads')"
        :loading="busy === 'reevaluate'"
        @click="reevaluateLeads"
      />
      <Button
        v-else
        :label="__('Create Template')"
        :loading="busy === 'template'"
        @click="createTemplate"
      />
      <Button
        variant="solid"
        :label="__('Fetch Leads')"
        :loading="busy === 'fetch'"
        @click="fetchLeads"
      />
    </template>
    <template #tab="{ tab }">
      <RelatedList
        v-if="tab === 'Leads'"
        ref="leads"
        entity="leads"
        :filters="{ lead_form: formId }"
        :columns="[
          { label: __('Lead ID'), key: 'lead_id' },
          { label: __('Client Country'), key: 'client_country' },
          { label: __('Score'), key: 'percentage', type: 'Percent' },
          { label: __('Is MQL'), key: 'is_mql' },
          { label: __('Created (Meta)'), key: 'created_time', type: 'Datetime' },
        ]"
        orderBy="created_time desc"
      />
      <div v-else-if="tab === 'Questions'" class="flex flex-col gap-4 p-5">
        <div
          v-for="(question, i) in summary.data?.questions || []"
          :key="question.key || i"
          class="rounded border p-4"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="text-base font-medium text-ink-gray-9">
              {{ i + 1 }}. {{ question.label }}
            </div>
            <Badge variant="subtle" :label="question.type" />
          </div>
          <div class="mt-1 text-sm text-ink-gray-5">{{ question.key }}</div>
          <ul v-if="question.options.length" class="mt-3 list-disc pl-5 text-base text-ink-gray-8">
            <li v-for="option in question.options" :key="option">{{ option }}</li>
          </ul>
        </div>
        <EmptyState
          v-if="!summary.data?.questions?.length"
          :name="__('Questions')"
          icon="help-circle"
          :description="__('Use Fetch Forms on the form\'s page to get its questions.')"
        />
      </div>
    </template>
    <template #side>
      <SideField :label="__('Page')">
        <router-link
          v-if="form.doc.page"
          :to="{ name: 'Marketing Page', params: { pageId: form.doc.page } }"
          class="underline"
        >
          {{ summary.data?.page_name || form.doc.page }}
        </router-link>
      </SideField>
      <SideField :label="__('Status')" :value="form.doc.status" />
      <SideField :label="__('Leads (Meta)')" :value="form.doc.leads_count" />
      <SideField :label="__('Leads Stored')" :value="summary.data?.leads" />
      <SideField :label="__('Evaluation Template')">
        <router-link
          v-if="form.doc.evaluation_template"
          :to="{ name: 'Marketing Template', params: { templateId: form.doc.evaluation_template } }"
          class="underline"
        >
          {{ summary.data?.template_title || form.doc.evaluation_template }}
        </router-link>
        <span v-else class="text-ink-gray-5">{{ __('Not set') }}</span>
      </SideField>
      <SideField :label="__('Evaluated Leads')" :value="summary.data?.evaluated" />
      <SideField :label="__('MQL Leads')" :value="summary.data?.mql" />
    </template>
  </MarketingDetailShell>
</template>
<script setup>
// Marketing Workflow → Form (a Meta lead form) with the actions of its desk form:
// Fetch Leads, Re-evaluate Leads, Create Template, and its evaluation template.
import MarketingDetailShell from '@/components/Marketing/MarketingDetailShell.vue'
import RelatedList from '@/components/Marketing/RelatedList.vue'
import SideField from '@/components/Marketing/SideField.vue'
import EmptyState from '@/components/ListViews/EmptyState.vue'
import { marketingApi, runMarketingAction } from '@/components/Marketing/marketing'
import { useDocument } from '@/data/document'
import { Badge, createResource } from 'frappe-ui'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({ formId: { type: String, required: true } })

const { document: form } = useDocument('Meta Lead Form', props.formId)
const summary = createResource({
  url: 'fcrm_meta_integration.fcrm_meta_integration.portal.get_form_summary',
  params: { form: props.formId },
  auto: true,
})
const router = useRouter()
const leads = ref(null)
const busy = ref('')

function refresh() {
  form.reload()
  summary.reload()
  leads.value?.reload()
}

async function fetchLeads() {
  busy.value = 'fetch'
  const result = await runMarketingAction({
    run: () => marketingApi('fetch_form_leads', { form: props.formId }),
    success: (r) => __('Fetched {0} lead(s).', [r?.total ?? 0]),
  })
  busy.value = ''
  if (result) refresh()
}

async function reevaluateLeads() {
  busy.value = 'reevaluate'
  const result = await runMarketingAction({
    confirm: {
      title: __('Re-evaluate Leads'),
      message: __(
        'Re-score every lead of this form with its evaluation template? Existing submissions are updated in place.',
      ),
      label: __('Re-evaluate'),
    },
    run: () => marketingApi('reevaluate_form_leads', { form: props.formId }),
    success: (r) => {
      let message = __('Evaluated {0} of {1} lead(s): {2} MQL.', [r.evaluated, r.total, r.mql])
      if (r.failed) message += ' ' + __('{0} failed.', [r.failed])
      if (r.unmatched_questions?.length)
        message += ' ' + __('Unmatched questions: {0}', [r.unmatched_questions.join(', ')])
      return message
    },
  })
  busy.value = ''
  if (result) refresh()
}

async function createTemplate() {
  busy.value = 'template'
  const result = await runMarketingAction({
    confirm: {
      title: __('Create Template'),
      message: __(
        "Create an evaluation template (quiz) from this form's questions and open it to set the question marks and option weights?",
      ),
      label: __('Create'),
    },
    run: () => marketingApi('create_form_template', { form: props.formId }),
    success: (r) => __('Template {0} created. Set the marks and option weights.', [r.name]),
  })
  busy.value = ''
  if (result?.name) openTemplate(result.name)
}

// the template page of the CRM portal
function openTemplate(templateId) {
  router.push({ name: 'Marketing Template', params: { templateId } })
}
</script>
