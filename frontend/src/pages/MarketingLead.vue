<template>
  <MarketingDetailShell
    entity="leads"
    :docname="leadId"
    :document="lead"
    :tabs="[
      { name: 'Answers', label: __('Answers'), icon: 'message-square' },
      { name: 'Evaluation', label: __('Evaluation'), icon: 'check-square' },
    ]"
  >
    <template #actions>
      <Button
        v-if="lead.doc.evaluation_template"
        :label="__('Evaluation Template')"
        @click="
          router.push({
            name: 'Marketing Template',
            params: { templateId: lead.doc.evaluation_template },
          })
        "
      />
    </template>
    <template #tab="{ tab }">
      <div v-if="tab === 'Answers'" class="p-5">
        <table v-if="summary.data?.answers?.length" class="w-full text-base">
          <tbody>
            <tr
              v-for="(row, i) in summary.data.answers"
              :key="i"
              class="border-b align-top"
            >
              <td class="w-1/2 py-2.5 pr-4 text-ink-gray-5">{{ row.question }}</td>
              <td class="py-2.5 text-ink-gray-9">{{ row.answer }}</td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else :name="__('Answers')" icon="message-square" />
      </div>
      <div v-else-if="tab === 'Evaluation'" class="p-5">
        <template v-if="summary.data?.results">
          <table class="w-full text-base">
            <thead>
              <tr class="border-b text-left text-ink-gray-5">
                <th class="py-2 pr-4 font-normal">{{ __('Question') }}</th>
                <th class="py-2 pr-4 font-normal">{{ __('Answer') }}</th>
                <th class="py-2 text-right font-normal">{{ __('Marks') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in summary.data.results.rows" :key="i" class="border-b align-top">
                <td class="py-2.5 pr-4 text-ink-gray-9">{{ row.question }}</td>
                <td class="py-2.5 pr-4 text-ink-gray-9">
                  <span v-if="row.answer">{{ row.answer }}</span>
                  <span v-else class="text-ink-gray-4">{{ __('Not answered') }}</span>
                </td>
                <td
                  class="py-2.5 text-right whitespace-nowrap"
                  :class="row.marks > 0 ? 'text-ink-green-3' : 'text-ink-gray-5'"
                >
                  {{ num(row.marks) }} / {{ num(row.marks_out_of) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="font-medium text-ink-gray-9">
                <td colspan="2" class="py-2.5 text-right pr-4">{{ __('Total') }}</td>
                <td class="py-2.5 text-right whitespace-nowrap">
                  {{ num(summary.data.results.score) }} / {{ num(summary.data.results.score_out_of) }}
                  ({{ num(summary.data.results.percentage) }}%)
                </td>
              </tr>
            </tfoot>
          </table>
        </template>
        <EmptyState
          v-else
          :name="__('Evaluation')"
          icon="check-square"
          :description="__('This lead has not been evaluated: its form has no evaluation template.')"
        />
      </div>
    </template>
    <template #side>
      <div v-if="lead.doc.submission">
        <Badge
          size="lg"
          variant="subtle"
          :theme="lead.doc.is_mql ? 'green' : 'gray'"
          :label="lead.doc.is_mql ? __('MQL') : __('Not MQL')"
        />
      </div>
      <SideField
        v-if="lead.doc.submission"
        :label="__('Score')"
        :value="`${num(lead.doc.score)} (${num(lead.doc.percentage)}%)`"
      />
      <SideField :label="__('Form')">
        <router-link
          v-if="lead.doc.lead_form"
          :to="{ name: 'Marketing Form', params: { formId: lead.doc.lead_form } }"
          class="underline"
        >
          {{ summary.data?.form_name || lead.doc.lead_form }}
        </router-link>
      </SideField>
      <SideField :label="__('Client Country')" :value="lead.doc.client_country">
        <div>{{ lead.doc.client_country || '-' }}</div>
        <div v-if="lead.doc.client_country_resolved_from" class="text-sm text-ink-gray-5">
          {{ __('Resolved from {0}', [lead.doc.client_country_resolved_from]) }}
        </div>
      </SideField>
      <SideField :label="__('Campaign')" :value="lead.doc.campaign_name" />
      <SideField :label="__('Ad')" :value="lead.doc.ad_name" />
      <SideField :label="__('Platform')" :value="lead.doc.platform" />
      <SideField
        :label="__('Created (Meta)')"
        :value="lead.doc.created_time && formatDate(lead.doc.created_time)"
      />
    </template>
  </MarketingDetailShell>
</template>
<script setup>
// Marketing Workflow → Lead (a Meta lead): its answers, evaluation and links to its
// form and evaluation template.
import MarketingDetailShell from '@/components/Marketing/MarketingDetailShell.vue'
import SideField from '@/components/Marketing/SideField.vue'
import EmptyState from '@/components/ListViews/EmptyState.vue'
import { useDocument } from '@/data/document'
import { formatDate } from '@/utils'
import { Badge, createResource } from 'frappe-ui'
import { useRouter } from 'vue-router'

const props = defineProps({ leadId: { type: String, required: true } })

const { document: lead } = useDocument('Meta Lead', props.leadId)
const summary = createResource({
  url: 'fcrm_meta_integration.fcrm_meta_integration.portal.get_lead_summary',
  params: { lead: props.leadId },
  auto: true,
})

const router = useRouter()

// at most 2 decimals: 4.8 -> "4.8", 10 -> "10"
const num = (value) => String(Math.round((value || 0) * 100) / 100)
</script>
