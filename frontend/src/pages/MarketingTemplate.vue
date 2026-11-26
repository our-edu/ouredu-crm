<template>
  <LayoutHeader>
    <template #left-header>
      <Breadcrumbs :items="breadcrumbs" />
    </template>
    <template #right-header>
      <Badge v-if="dirty" theme="orange" :label="__('Not Saved')" />
      <Button
        v-if="template.data?.forms?.length"
        :label="__('Re-evaluate Leads')"
        :disabled="dirty"
        :tooltip="dirty ? __('Save the template first') : ''"
        :loading="reevaluating"
        @click="reevaluate"
      />
      <Button
        v-if="template.data?.can_write"
        variant="solid"
        :label="__('Save')"
        :disabled="!dirty"
        :loading="saving"
        @click="save"
      />
    </template>
  </LayoutHeader>
  <div v-if="draft" class="flex-1 overflow-y-auto">
    <div class="mx-auto flex max-w-4xl flex-col gap-6 p-5 sm:p-8">
      <!-- settings -->
      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <div class="text-lg font-semibold text-ink-gray-9">{{ __('Settings') }}</div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormControl v-model="draft.title" :label="__('Title')" :disabled="readOnly" />
          <FormControl
            v-model="draft.passing_percentage"
            type="number"
            :label="__('Passing Percentage')"
            :description="__('A lead is an MQL when its score reaches this percentage.')"
            :disabled="readOnly"
          />
          <div class="flex flex-col gap-1">
            <div class="text-xs text-ink-gray-5">{{ __('Total Marks') }}</div>
            <div class="text-base text-ink-gray-9">{{ totalMarks }}</div>
          </div>
          <Switch
            v-model="draft.full_mark_open_ended"
            :label="__('Full Mark to Open-ended')"
            :description="__('An answered open ended question gets its full marks, an unanswered one zero.')"
            :disabled="readOnly"
          />
        </div>
        <div v-if="template.data.forms.length" class="flex flex-wrap items-center gap-2 text-base">
          <span class="text-ink-gray-5">{{ __('Evaluation template of') }}</span>
          <router-link
            v-for="form in template.data.forms"
            :key="form.name"
            :to="{ name: 'Marketing Form', params: { formId: form.name } }"
            class="underline text-ink-gray-9"
          >
            {{ form.form_name || form.name }}
          </router-link>
        </div>
      </div>

      <!-- questions -->
      <div class="text-lg font-semibold text-ink-gray-9">
        {{ __('Questions') }} ({{ draft.questions.length }})
      </div>
      <div
        v-for="(question, i) in draft.questions"
        :key="question.row"
        class="flex flex-col gap-3 rounded-lg border p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex flex-col gap-1 min-w-0">
            <div class="text-base font-medium text-ink-gray-9 break-words">
              {{ i + 1 }}. {{ question.text }}
            </div>
            <div class="flex gap-2">
              <Badge variant="subtle" :label="__(question.type)" />
              <Badge v-if="question.multiple" variant="subtle" :label="__('Multiple')" />
            </div>
          </div>
          <FormControl
            v-model="question.marks"
            class="w-24 shrink-0"
            type="number"
            :label="__('Marks')"
            :disabled="readOnly"
          />
        </div>

        <template v-if="question.type === 'Choices'">
          <FormControl
            v-model="question.weight_type"
            class="w-64"
            type="select"
            :label="__('Weight Entry Mode')"
            :options="[
              { label: __('Percentage (0–100%)'), value: 'Percentage' },
              { label: __('Points (up to the marks)'), value: 'Points' },
            ]"
            :disabled="readOnly"
          />
          <div class="flex flex-col divide-y rounded border">
            <div
              v-for="option in question.options"
              :key="option.option"
              class="flex items-center justify-between gap-4 px-3 py-2"
            >
              <div class="text-base text-ink-gray-8 break-words">{{ option.option }}</div>
              <div class="flex items-center gap-2 shrink-0">
                <FormControl
                  v-model="option.weight"
                  class="w-24"
                  type="number"
                  :disabled="readOnly"
                />
                <span class="w-8 text-sm text-ink-gray-5">
                  {{ question.weight_type === 'Points' ? __('pts') : '%' }}
                </span>
              </div>
            </div>
          </div>
        </template>
        <div v-else-if="question.type === 'Open Ended'" class="text-sm text-ink-gray-5">
          {{
            draft.full_mark_open_ended
              ? __('Answered: full marks. Not answered: zero.')
              : __('Not scored automatically (enable Full Mark to Open-ended).')
          }}
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="template.loading" class="p-8 text-base text-ink-gray-5">
    {{ __('Loading...') }}
  </div>
  <ErrorPage
    v-else-if="template.error"
    errorTitle="Not Found"
    :errorMessage="errorMessage(template.error)"
  />
</template>
<script setup>
// Marketing Workflow → evaluation template (a quiz_crm Quiz) of a lead form, edited
// in the CRM portal: settings, question marks, option weights; links back to the
// form(s) and re-evaluates their leads.
import LayoutHeader from '@/components/LayoutHeader.vue'
import ErrorPage from '@/components/ErrorPage.vue'
import {
  marketingApi,
  runMarketingAction,
  errorMessage,
} from '@/components/Marketing/marketing'
import { getSettings } from '@/stores/settings'
import {
  Badge,
  Breadcrumbs,
  FormControl,
  Switch,
  createResource,
  usePageMeta,
} from 'frappe-ui'
import { computed, ref } from 'vue'

const props = defineProps({ templateId: { type: String, required: true } })

const { brand } = getSettings()
const draft = ref(null)
const saving = ref(false)
const reevaluating = ref(false)

// editable copy of the template; `dirty` compares it with what was loaded
const toDraft = (data) => ({
  title: data.title,
  passing_percentage: data.passing_percentage,
  full_mark_open_ended: Boolean(data.full_mark_open_ended),
  questions: data.questions.map((q) => ({
    ...q,
    options: q.options.map((o) => ({ ...o })),
  })),
})
const toPayload = (d) => ({
  title: d.title,
  passing_percentage: Number(d.passing_percentage) || 0,
  full_mark_open_ended: d.full_mark_open_ended ? 1 : 0,
  questions: d.questions.map((q) => ({
    row: q.row,
    marks: Number(q.marks) || 0,
    weight_type: q.weight_type,
    options: q.options.map((o) => ({ option: o.option, weight: Number(o.weight) || 0 })),
  })),
})

const template = createResource({
  url: 'fcrm_meta_integration.fcrm_meta_integration.portal.get_template',
  params: { template: props.templateId },
  auto: true,
  onSuccess: (data) => (draft.value = toDraft(data)),
})

const readOnly = computed(() => !template.data?.can_write)
const dirty = computed(
  () =>
    draft.value &&
    template.data &&
    JSON.stringify(toPayload(draft.value)) !==
      JSON.stringify(toPayload(toDraft(template.data))),
)
const totalMarks = computed(() =>
  (draft.value?.questions || []).reduce((sum, q) => sum + (Number(q.marks) || 0), 0),
)

const breadcrumbs = computed(() => {
  let items = [{ label: __('Forms'), route: { name: 'Marketing Forms' } }]
  const form = template.data?.forms?.[0]
  if (form) {
    items.push({
      label: form.form_name || form.name,
      route: { name: 'Marketing Form', params: { formId: form.name } },
    })
  }
  items.push({
    label: template.data?.title || props.templateId,
    route: { name: 'Marketing Template', params: { templateId: props.templateId } },
  })
  return items
})

usePageMeta(() => ({
  title: template.data?.title || props.templateId,
  icon: brand.favicon,
}))

async function save() {
  saving.value = true
  const result = await runMarketingAction({
    run: () =>
      marketingApi('save_template', {
        template: props.templateId,
        data: JSON.stringify(toPayload(draft.value)),
      }),
    success: () => __('Template saved.'),
  })
  saving.value = false
  if (result) {
    template.setData(result)
    draft.value = toDraft(result)
  }
}

async function reevaluate() {
  reevaluating.value = true
  await runMarketingAction({
    confirm: {
      title: __('Re-evaluate Leads'),
      message: __(
        'Re-score the leads of {0} with this template? Existing submissions are updated in place.',
        [template.data.forms.map((f) => f.form_name || f.name).join(', ')],
      ),
      label: __('Re-evaluate'),
    },
    run: async () => {
      let total = 0, mql = 0
      for (const form of template.data.forms) {
        const r = await marketingApi('reevaluate_form_leads', { form: form.name })
        total += r.evaluated
        mql += r.mql
      }
      return { total, mql }
    },
    success: (r) => __('Evaluated {0} lead(s): {1} MQL.', [r.total, r.mql]),
  })
  reevaluating.value = false
}
</script>
