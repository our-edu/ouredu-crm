<template>
  <div v-if="list.loading && !list.data" class="p-5 text-base text-ink-gray-5">
    {{ __('Loading...') }}
  </div>
  <ListView
    v-else-if="list.data?.length"
    class="mt-4"
    :columns="columns"
    :rows="rows"
    :options="{
      selectable: false,
      showTooltip: false,
      getRowRoute: (row) => ({ name: config.docRoute, params: { [config.param]: row.name } }),
    }"
    row-key="name"
  >
    <ListHeader class="mx-3 sm:mx-5" />
    <ListRows
      :rows="rows"
      :doctype="config.doctype"
      class="mx-3 sm:mx-5"
      v-slot="{ column, item }"
    >
      <ListRowItem :item="item" :align="column.align">
        <template #default="{ label }">
          <Badge
            v-if="column.key === 'is_mql'"
            :theme="item ? 'green' : 'gray'"
            variant="subtle"
            :label="item ? __('MQL') : __('Not MQL')"
          />
          <FormControl
            v-else-if="column.type === 'Check'"
            type="checkbox"
            :modelValue="item"
            :disabled="true"
          />
          <div v-else class="truncate text-base">{{ label }}</div>
        </template>
      </ListRowItem>
    </ListRows>
  </ListView>
  <EmptyState v-else :name="__(config.label)" :icon="config.emptyIcon" />
</template>
<script setup>
// Documents linked to the current one (e.g. a page's forms, a form's leads),
// each row opening its own Marketing page.
import EmptyState from '@/components/ListViews/EmptyState.vue'
// the CRM's ListRows passes { column, item, row } to the slot (frappe-ui's doesn't)
import ListRows from '@/components/ListViews/ListRows.vue'
import { marketing } from '@/components/Marketing/marketing'
import { formatDate } from '@/utils'
import {
  Badge,
  FormControl,
  ListView,
  ListHeader,
  ListRowItem,
  createListResource,
} from 'frappe-ui'
import { computed } from 'vue'

const props = defineProps({
  entity: { type: String, required: true },
  filters: { type: Object, required: true },
  // [{ label, key, type?, width? }]
  columns: { type: Array, required: true },
  orderBy: { type: String, default: 'creation desc' },
})

const config = marketing[props.entity]

const list = createListResource({
  doctype: config.doctype,
  fields: ['name', ...props.columns.map((c) => c.key)],
  filters: props.filters,
  orderBy: props.orderBy,
  pageLength: 500,
  auto: true,
})

const rows = computed(() =>
  (list.data || []).map((doc) => {
    let row = { name: doc.name }
    props.columns.forEach((col) => {
      let value = doc[col.key]
      if (col.type === 'Datetime' && value) value = formatDate(value)
      if (col.type === 'Percent' && value != null) value = `${Math.round(value * 100) / 100}%`
      row[col.key] = value
    })
    return row
  }),
)

defineExpose({ reload: () => list.reload() })
</script>
