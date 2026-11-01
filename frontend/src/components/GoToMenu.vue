<template>
  <Popover trigger="hover" :hoverDelay="0.3" placement="bottom-start">
    <template #target>
      <slot />
    </template>
    <template #body-main>
      <div class="w-56 max-h-80 overflow-auto p-1">
        <div v-if="!nonEmptyGroups.length" class="px-2 py-2 text-sm text-ink-gray-5">
          {{ __('Nothing to go to') }}
        </div>
        <template v-for="group in nonEmptyGroups" :key="group.label">
          <div
            class="px-2 pt-2 pb-1 text-xs font-medium capitalize text-ink-gray-4"
          >
            {{ group.label }}
          </div>
          <RouterLink
            v-for="link in group.links"
            :key="link.label"
            :to="link.route"
            class="block truncate rounded px-2 py-2 text-sm text-ink-gray-7 hover:bg-surface-gray-2"
          >
            {{ link.label }}
          </RouterLink>
        </template>
      </div>
    </template>
  </Popover>
</template>

<script setup>
import { computed } from 'vue'
import { Popover } from 'frappe-ui'
import { RouterLink } from 'vue-router'

const props = defineProps({
  groups: { type: Array, default: () => [] },
})

const nonEmptyGroups = computed(() =>
  props.groups.filter((group) => group.links?.length),
)
</script>
