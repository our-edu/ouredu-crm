<template>
  <LayoutHeader>
    <template #left-header>
      <ViewBreadcrumbs v-model="viewControls" :routeName="config.listRoute" />
    </template>
    <template #right-header>
      <CustomActions
        v-if="listView?.customListActions"
        :actions="listView.customListActions"
      />
      <Button
        variant="solid"
        :label="__(fetchAction.label)"
        :loading="fetching"
        @click="fetchFromMeta"
      >
        <template #prefix>
          <RefreshIcon class="h-4 w-4" />
        </template>
      </Button>
    </template>
  </LayoutHeader>
  <ViewControls
    ref="viewControls"
    v-model="list"
    v-model:loadMore="loadMore"
    v-model:resizeColumn="triggerResize"
    v-model:updatedPageCount="updatedPageCount"
    :doctype="config.doctype"
  />
  <MarketingListView
    v-if="list.data && rows.length"
    ref="listView"
    v-model="list.data.page_length_count"
    v-model:list="list"
    :doctype="config.doctype"
    :docRoute="config.docRoute"
    :param="config.param"
    :rows="rows"
    :columns="columns"
    :options="{
      showTooltip: false,
      resizeColumn: true,
      rowCount: list.data.row_count,
      totalCount: list.data.total_count,
    }"
    @loadMore="() => loadMore++"
    @columnWidthUpdated="() => triggerResize++"
    @updatePageCount="(count) => (updatedPageCount = count)"
    @applyFilter="(data) => viewControls.applyFilter(data)"
    @applyLikeFilter="(data) => viewControls.applyLikeFilter(data)"
    @likeDoc="(data) => viewControls.likeDoc(data)"
    @selectionsChanged="
      (selections) => viewControls.updateSelections(selections)
    "
  />
  <EmptyState
    v-else-if="list.data && !rows.length"
    :name="__(config.label)"
    :icon="config.emptyIcon"
    :description="__('Use {0} to get them from Meta.', [__(fetchAction.label)])"
  />
</template>
<script setup>
import RefreshIcon from '~icons/lucide/refresh-cw'
import ViewBreadcrumbs from '@/components/ViewBreadcrumbs.vue'
import CustomActions from '@/components/CustomActions.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import MarketingListView from '@/components/ListViews/MarketingListView.vue'
import EmptyState from '@/components/ListViews/EmptyState.vue'
import ViewControls from '@/components/ViewControls.vue'
import {
  marketing,
  marketingApi,
  runMarketingAction,
} from '@/components/Marketing/marketing'
import { getMeta } from '@/stores/meta'
import { formatDate, timeAgo } from '@/utils'
import { ref, computed } from 'vue'

const props = defineProps({
  // key of `marketing`: pages | forms | leads
  entity: { type: String, required: true },
})

const config = marketing[props.entity]

// "Fetch …" button of each list: get the records from Meta
const fetchActions = {
  pages: {
    label: 'Fetch Pages',
    run: () => marketingApi('fetch_pages'),
    success: (r) =>
      __('Found {0} page(s), {1} new.', [r?.total ?? 0, r?.created ?? 0]),
  },
  forms: {
    label: 'Fetch Forms',
    run: () => marketingApi('fetch_forms'),
    success: (r) => {
      let message = __('Fetched {0} form(s) from {1} page(s).', [
        r?.forms ?? 0,
        r?.pages ?? 0,
      ])
      if (r?.errors?.length) message += ' ' + __('Failed: {0}', [r.errors.join(' | ')])
      return message
    },
  },
  leads: {
    label: 'Fetch Leads',
    confirm: {
      title: __('Fetch Leads'),
      message: __(
        'Fetch campaigns, ads and new leads of all enabled ad accounts from Meta in the background?',
      ),
      label: __('Fetch'),
    },
    run: () => marketingApi('fetch_leads'),
    success: () =>
      __('Fetching leads in the background. Refresh the list in a few minutes.'),
  },
}
const fetchAction = fetchActions[props.entity]

const { getFormattedPercent, getFormattedFloat, getFormattedCurrency } =
  getMeta(config.doctype)

const listView = ref(null)
const fetching = ref(false)

// list data is loaded in the ViewControls component
const list = ref({})
const loadMore = ref(1)
const triggerResize = ref(1)
const updatedPageCount = ref(20)
const viewControls = ref(null)

async function fetchFromMeta() {
  fetching.value = true
  const result = await runMarketingAction(fetchAction)
  fetching.value = false
  if (result !== undefined) list.value?.reload?.()
}

const rows = computed(() => {
  if (
    !list.value?.data?.data ||
    !['list', 'group_by'].includes(list.value.data.view_type)
  )
    return []
  return list.value.data.data.map((doc) => {
    let _rows = {}
    list.value.data.rows.forEach((row) => {
      _rows[row] = doc[row]

      let fieldType = list.value.data.columns?.find(
        (col) => (col.key || col.value) == row,
      )?.type

      if (
        fieldType &&
        ['Date', 'Datetime'].includes(fieldType) &&
        !['modified', 'creation'].includes(row)
      ) {
        _rows[row] = formatDate(doc[row], '', true, fieldType == 'Datetime')
      }
      if (fieldType == 'Currency') _rows[row] = getFormattedCurrency(row, doc)
      if (fieldType == 'Float') _rows[row] = getFormattedFloat(row, doc)
      if (fieldType == 'Percent') _rows[row] = getFormattedPercent(row, doc)

      if (['modified', 'creation'].includes(row)) {
        _rows[row] = {
          label: formatDate(doc[row]),
          timeAgo: __(timeAgo(doc[row])),
        }
      }
    })
    return _rows
  })
})

const columns = computed(() => {
  let _columns = list.value?.data?.columns || []
  // align the last column right, like the other lists
  return _columns.map((col, index) =>
    index === _columns.length - 1 ? { ...col, align: 'right' } : col,
  )
})
</script>
