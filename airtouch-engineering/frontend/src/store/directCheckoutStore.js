import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Zustand store for direct "Buy Now" checkout.
 * Keeps direct purchase items isolated from the persistent cart store.
 * Backed by sessionStorage so page refreshes during checkout preserve the item,
 * while session expiration or tab closure cleans up automatically.
 */
export const useDirectCheckoutStore = create(
  persist(
    (set) => ({
      items: [], // Array<{ productId: string, quantity: number }>
      directItems: [], // Alias for convenience

      /**
       * Set the single item or items for direct checkout.
       * Normalizes input objects to { productId, quantity }.
       */
      setDirectItems: (items) => {
        const normalized = (Array.isArray(items) ? items : [])
          .map((item) => {
            const id = typeof item === 'string' ? item : (item?.productId || item?.id)
            const quantity = Math.max(1, Number(item?.quantity) || 1)
            return { productId: id, quantity }
          })
          .filter((item) => Boolean(item.productId))

        set({
          items: normalized,
          directItems: normalized,
        })
      },

      /**
       * Clear direct checkout items after an order is placed or when dismissed.
       */
      clearDirectItems: () => {
        set({
          items: [],
          directItems: [],
        })
      },
    }),
    {
      name: 'airtouch-direct-checkout',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
