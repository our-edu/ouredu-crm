import { createSharedComposable, useNow } from '@vueuse/core'

/** One clock, ticking every 30 seconds, shared by every component that uses it. */
export const useSharedNow = createSharedComposable(() =>
  useNow({ interval: 30000 }),
)
