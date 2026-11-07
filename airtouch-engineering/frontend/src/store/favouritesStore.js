import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Zustand favourites store with localStorage persistence.
 * Stores product IDs only.
 * Key: "airtouch-favourites"
 */
export const useFavouritesStore = create(
  persist(
    (set, get) => ({
      favourites: [], // Array<string> of product IDs

      addFavourite: (id) => {
        const cleanId = String(id || '').trim()
        if (!cleanId) return
        const current = get().favourites || []
        if (!current.includes(cleanId)) {
          set({ favourites: [...current, cleanId] })
        }
      },

      removeFavourite: (id) => {
        const cleanId = String(id || '').trim()
        set({
          favourites: (get().favourites || []).filter((favId) => favId !== cleanId),
        })
      },

      toggleFavourite: (id) => {
        const cleanId = String(id || '').trim()
        if (!cleanId) return
        const current = get().favourites || []
        if (current.includes(cleanId)) {
          set({ favourites: current.filter((favId) => favId !== cleanId) })
        } else {
          set({ favourites: [...current, cleanId] })
        }
      },

      isFavourite: (id) => {
        const cleanId = String(id || '').trim()
        return (get().favourites || []).includes(cleanId)
      },

      clearFavourites: () => set({ favourites: [] }),
    }),
    {
      name: 'airtouch-favourites',
    }
  )
)

export default useFavouritesStore
