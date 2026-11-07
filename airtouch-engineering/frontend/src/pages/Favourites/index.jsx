import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { useFavouritesStore } from '../../store/favouritesStore.js'
import { PRODUCTS } from '../../data/products.js'

export default function Favourites() {
  const favourites = useFavouritesStore((state) => state.favourites)
  const removeFavourite = useFavouritesStore((state) => state.removeFavourite)
  const clearFavourites = useFavouritesStore((state) => state.clearFavourites)

  const favProducts = PRODUCTS.filter((p) => favourites.includes(p.id))

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-orange-500 fill-orange-500" />
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                My Favourites
              </h1>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Saved high-performance components and precision-engineered parts.
            </p>
          </div>

          {favProducts.length > 0 && (
            <button
              type="button"
              onClick={clearFavourites}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-red-400 transition-colors self-start sm:self-auto py-2 px-3 rounded-lg border border-zinc-800 hover:border-red-500/30 bg-zinc-900/50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Content */}
        {favProducts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
              No favourites saved yet
            </h2>
            <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">
              You haven&apos;t added any items to your wishlist. Explore our performance catalog to find parts engineered for your machine.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-orange-500/20"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Products</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-8">
            {favProducts.map((product) => {
              const mainImage =
                product.images?.[0] ||
                product.image ||
                '/placeholder-part.jpg'

              return (
                <div
                  key={product.id}
                  className="group relative bg-zinc-900/60 border border-zinc-800 hover:border-orange-500/40 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/5"
                >
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFavourite(product.id)}
                    aria-label={`Remove ${product.name} from favourites`}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-zinc-950/80 hover:bg-red-500 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shadow-md backdrop-blur-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Product Image */}
                  <Link
                    to={`/products/${product.id}`}
                    className="block aspect-square w-full bg-zinc-950 overflow-hidden relative"
                  >
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {product.brand && (
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-zinc-950/80 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 backdrop-blur-sm">
                        {product.brand}
                      </span>
                    )}
                  </Link>

                  {/* Product Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                      {product.categoryName || product.category}
                    </p>
                    <Link
                      to={`/products/${product.id}`}
                      className="font-bold text-sm text-zinc-100 hover:text-orange-400 line-clamp-2 transition-colors mb-3"
                    >
                      {product.name}
                    </Link>

                    <div className="mt-auto pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-base font-black text-white">
                          ₹{Number(product.price || 0).toLocaleString('en-IN')}
                        </span>
                        {product.mrp && product.mrp > product.price && (
                          <span className="ml-2 text-xs text-zinc-400 line-through">
                            ₹{Number(product.mrp).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/products/${product.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
