import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PRODUCTS, getProductById } from '../data/products.js'

export const FREE_DELIVERY_THRESHOLD = 999
export const STANDARD_DELIVERY_FEE = 99

/**
 * Zustand cart store with localStorage persistence.
 * Stores only { productId, quantity } pairs.
 * Product details are derived dynamically from the catalog at read time.
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // Array<{ productId: string, quantity: number }>

      /**
       * Add a product to the cart.
       * Accepts either a productId string or a product object { id, ... }.
       */
      addItem: (productOrId, qty = 1) => {
        const id = typeof productOrId === 'string'
          ? productOrId
          : (productOrId?.productId || productOrId?.id)

        if (!id) return false

        const product = getProductById(id)
        if (!product) return false

        const maxStock = typeof product.stock === 'number' ? product.stock : 99
        if (maxStock <= 0) return false

        const addQty = Math.max(1, Number(qty) || 1)

        set((state) => {
          const currentItems = state.items || []
          const existingIndex = currentItems.findIndex(
            (i) => (i.productId || i.id) === id
          )

          if (existingIndex > -1) {
            const currentQty = currentItems[existingIndex].quantity || 1
            const nextQty = Math.min(currentQty + addQty, maxStock)
            const updated = [...currentItems]
            updated[existingIndex] = {
              productId: id,
              quantity: nextQty,
            }
            return { items: updated }
          }

          return {
            items: [
              ...currentItems,
              {
                productId: id,
                quantity: Math.min(addQty, maxStock),
              },
            ],
          }
        })

        return true
      },

      /**
       * Remove a product from the cart by its ID.
       */
      removeItem: (productIdOrId) => {
        set((state) => ({
          items: (state.items || []).filter(
            (item) => (item.productId || item.id) !== productIdOrId
          ),
        }))
      },

      /**
       * Update quantity of an item. Clamps to [1, stock]. If qty <= 0, removes item.
       */
      updateQuantity: (productIdOrId, nextQty) => {
        const targetQty = Number(nextQty)
        if (targetQty <= 0) {
          get().removeItem(productIdOrId)
          return
        }

        const product = getProductById(productIdOrId)
        const maxStock = product && typeof product.stock === 'number' ? product.stock : 99
        const clampedQty = Math.min(Math.max(1, targetQty), maxStock)

        set((state) => ({
          items: (state.items || []).map((item) => {
            if ((item.productId || item.id) === productIdOrId) {
              return { productId: productIdOrId, quantity: clampedQty }
            }
            return item
          }),
        }))
      },

      /**
       * Empty the entire cart.
       */
      clearCart: () => set({ items: [] }),

      /**
       * Derive full product details for each cart item.
       * Gracefully handles items whose productId no longer exists in catalog.
       */
      getCartItemsWithDetails: () => {
        const rawItems = get().items || []
        const detailed = []

        for (const item of rawItems) {
          const id = item.productId || item.id
          const product = getProductById(id)
          if (product) {
            const qty = Math.max(1, Number(item.quantity) || 1)
            const price = Number(product.price) || 0
            const mrp = Number(product.mrp || product.originalPrice || price)
            detailed.push({
              ...product,
              productId: product.id,
              quantity: qty,
              lineTotal: price * qty,
              lineMrpTotal: mrp * qty,
            })
          }
        }

        return detailed
      },

      /**
       * Total item count across all valid cart items.
       */
      getTotalCount: () => {
        const items = get().getCartItemsWithDetails()
        return items.reduce((sum, item) => sum + item.quantity, 0)
      },

      /**
       * Subtotal before delivery and discounts (based on selling price).
       */
      getSubtotal: () => {
        const items = get().getCartItemsWithDetails()
        return items.reduce((sum, item) => sum + item.lineTotal, 0)
      },

      /**
       * Total MRP of all items in cart.
       */
      getTotalMrp: () => {
        const items = get().getCartItemsWithDetails()
        return items.reduce((sum, item) => sum + item.lineMrpTotal, 0)
      },

      /**
       * Total discount saved compared to MRP.
       */
      getTotalDiscount: () => {
        const totalMrp = get().getTotalMrp()
        const subtotal = get().getSubtotal()
        return Math.max(0, totalMrp - subtotal)
      },

      /**
       * Delivery fee: ₹0 if cart is empty or subtotal >= 999, else ₹99.
       */
      getDeliveryFee: () => {
        const subtotal = get().getSubtotal()
        if (subtotal <= 0) return 0
        return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE
      },

      /**
       * Grand total including delivery charges.
       */
      getGrandTotal: () => {
        const subtotal = get().getSubtotal()
        if (subtotal <= 0) return 0
        return subtotal + get().getDeliveryFee()
      },

      /**
       * Legacy helper for total.
       */
      total: () => get().getGrandTotal(),
    }),
    {
      name: 'airtouch-cart',
      version: 2,
      migrate: (persistedState, version) => {
        if (!persistedState || !persistedState.items) {
          return { items: [] }
        }
        // Normalize any old item objects to { productId, quantity }
        const normalized = persistedState.items.map((i) => ({
          productId: i.productId || i.id,
          quantity: Number(i.quantity) || 1,
        }))
        return { items: normalized }
      },
    }
  )
)

export default useCartStore
