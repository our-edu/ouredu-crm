<template>
  <div v-if="preferences" class="mt-10">
    <div class="flex items-center justify-between">
      <div class="flex gap-2 items-center h-7">
        <div class="text-base font-semibold text-ink-gray-9">
          {{ __('Notifications') }}
        </div>
        <Badge
          v-if="isDirty"
          :variant="'subtle'"
          :theme="'orange'"
          size="sm"
          :label="__('Not Saved')"
        />
      </div>
      <Button
        v-if="isDirty"
        :label="__('Save')"
        :loading="updateNotificationPreferences.loading"
        @click="save()"
      />
    </div>
    <div
      v-if="!preferences.has_sales_agent"
      class="mt-2 text-p-sm text-ink-gray-6"
    >
      {{
        __(
          'No Sales Agent is linked to your user, so these settings cannot be changed.',
        )
      }}
    </div>
    <div
      v-for="df in visibleFields"
      :key="df.fieldname"
      class="flex items-center justify-between gap-4 mt-6"
    >
      <div class="flex flex-col gap-1">
        <span class="text-base font-medium text-ink-gray-8">
          {{ __(df.label) }}
        </span>
        <span v-if="df.description" class="text-p-sm text-ink-gray-6">
          {{ __(df.description) }}
        </span>
      </div>
      <Switch
        v-if="df.fieldtype === 'Check'"
        :model-value="Boolean(doc[df.fieldname])"
        :disabled="!preferences.has_sales_agent"
        @update:model-value="doc[df.fieldname] = $event ? 1 : 0"
      />
      <Select
        v-else-if="df.fieldtype === 'Select'"
        v-model="doc[df.fieldname]"
        :options="getSelectOptions(df)"
        :disabled="!preferences.has_sales_agent"
        class="!w-40 shrink-0"
      />
      <DurationInput
        v-else-if="df.fieldtype === 'Duration'"
        :value="doc[df.fieldname]"
        :disabled="!preferences.has_sales_agent"
        class="w-40 shrink-0"
        @change="doc[df.fieldname] = $event"
      />
    </div>
  </div>
</template>

<script setup>
import DurationInput from '@/components/Controls/DurationInput.vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import {
  notificationPreferences,
  updateNotificationPreferences,
} from '@/stores/notificationPreferences'
import { evaluateDependsOnValue } from '@/utils/expressions'
import { Badge, Select, Switch, toast } from 'frappe-ui'
import { ref, computed, watch } from 'vue'

const preferences = computed(() => notificationPreferences.data)
const doc = ref({})

notificationPreferences.fetch()

watch(preferences, (data) => (doc.value = { ...data?.values }), {
  immediate: true,
})

const visibleFields = computed(() =>
  (preferences.value?.fields || []).filter((df) =>
    evaluateDependsOnValue(df.depends_on, doc.value),
  ),
)

const isDirty = computed(
  () => JSON.stringify(doc.value) !== JSON.stringify(preferences.value?.values),
)

function getSelectOptions(df) {
  return (df.options || '')
    .split('\n')
    .map((option) => ({ label: __(option), value: option }))
}

function save() {
  updateNotificationPreferences.submit(
    { values: doc.value },
    {
      onSuccess: () => toast.success(__('Preferences Updated Successfully')),
      onError: (err) => toast.error(err.messages?.[0] || err.message),
    },
  )
}

useKeyboardShortcuts({
  ignoreTyping: false,
  shortcuts: [
    {
      match: (e) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's',
      action: () => {
        if (isDirty.value) save()
      },
    },
  ],
})
</script>
