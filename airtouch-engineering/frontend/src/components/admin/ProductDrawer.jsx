import { useState, useEffect } from 'react'
import {
  X,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react'
import {
  createAdminProduct,
  updateAdminProduct,
  uploadProductImage,
} from '../../services/adminApi.js'

const CATEGORIES = [
  { id: 'brakes', name: 'Brakes & Hydraulics' },
  { id: 'engine', name: 'Engine & Performance' },
  { id: 'chassis', name: 'Chassis & Suspension' },
  { id: 'tyres', name: 'Tyres & Wheels' },
  { id: 'exhaust', name: 'Exhaust Systems' },
  { id: 'lighting', name: 'Headlights & Lighting' },
  { id: 'seats', name: 'Seats & Bodywork' },
  { id: 'handlebars', name: 'Handlebars & Controls' },
]

export default function ProductDrawer({
  isOpen,
  onClose,
  productToEdit = null,
  onProductSaved,
}) {
  const isEdit = Boolean(productToEdit)

  // Form Fields
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('AirTouch Apex')
  const [category, setCategory] = useState('brakes')
  const [compatibilityText, setCompatibilityText] = useState('')
  const [price, setPrice] = useState('')
  const [mrp, setMrp] = useState('')
  const [stock, setStock] = useState('10')
  const [status, setStatus] = useState('active')
  const [shortDescription, setShortDescription] = useState('')
  const [highlights, setHighlights] = useState([''])
  const [specifications, setSpecifications] = useState([{ label: '', value: '' }])
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // UI state
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '')
      setBrand(productToEdit.brand || 'AirTouch Apex')
      setCategory(productToEdit.category || 'brakes')
      setCompatibilityText(
        Array.isArray(productToEdit.compatibility) ? productToEdit.compatibility.join('\n') : ''
      )
      setPrice(productToEdit.price !== undefined ? String(productToEdit.price) : '')
      setMrp(productToEdit.mrp !== undefined ? String(productToEdit.mrp) : '')
      setStock(productToEdit.stock !== undefined ? String(productToEdit.stock) : '10')
      setStatus(
        productToEdit.status ||
          (productToEdit.is_active === false ? 'hidden' : 'active')
      )
      setShortDescription(productToEdit.shortDescription || productToEdit.description || '')
      setHighlights(
        Array.isArray(productToEdit.highlights) && productToEdit.highlights.length > 0
          ? productToEdit.highlights
          : ['']
      )
      setSpecifications(
        Array.isArray(productToEdit.specifications) && productToEdit.specifications.length > 0
          ? productToEdit.specifications
          : [{ label: '', value: '' }]
      )
      setImagePreview(productToEdit.image || productToEdit.imageUrl || null)
      setImageFile(null)
    } else {
      // Defaults for new product
      setName('')
      setBrand('AirTouch Apex')
      setCategory('brakes')
      setCompatibilityText('')
      setPrice('')
      setMrp('')
      setStock('15')
      setStatus('active')
      setShortDescription('')
      setHighlights(['Track-tested high tensile construction', 'Direct bolt-on fitment without frame modifications'])
      setSpecifications([
        { label: 'Material', value: 'Aerospace Grade 6061-T6 Aluminum' },
        { label: 'Finish', value: 'Hard Anodized' },
      ])
      setImagePreview(null)
      setImageFile(null)
    }
    setErrors({})
    setServerError(null)
  }, [productToEdit, isOpen])

  if (!isOpen) return null

  // Validation
  const validateForm = () => {
    const errs = {}
    if (!name || name.trim().length < 2 || name.trim().length > 120) {
      errs.name = 'Product name must be between 2 and 120 characters.'
    }
    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      errs.price = 'Price must be a positive number.'
    }
    const numMrp = parseFloat(mrp)
    if (isNaN(numMrp) || numMrp <= 0) {
      errs.mrp = 'MRP must be a positive number.'
    } else if (numPrice && numMrp < numPrice) {
      errs.mrp = 'MRP cannot be less than the selling price.'
    }
    const numStock = parseInt(stock, 10)
    if (isNaN(numStock) || numStock < 0 || numStock > 100000) {
      errs.stock = 'Stock must be between 0 and 100,000.'
    }
    if (highlights.filter((h) => h.trim()).length > 5) {
      errs.highlights = 'Maximum 5 highlights allowed.'
    }
    if (specifications.filter((s) => s.label.trim() && s.value.trim()).length > 10) {
      errs.specifications = 'Maximum 10 specifications allowed.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Handle Highlights array
  const handleHighlightChange = (index, val) => {
    const updated = [...highlights]
    updated[index] = val
    setHighlights(updated)
  }

  const addHighlightField = () => {
    if (highlights.length < 5) {
      setHighlights([...highlights, ''])
    }
  }

  const removeHighlightField = (index) => {
    setHighlights(highlights.filter((_, i) => i !== index))
  }

  // Handle Specifications array
  const handleSpecChange = (index, field, val) => {
    const updated = [...specifications]
    updated[index] = { ...updated[index], [field]: val }
    setSpecifications(updated)
  }

  const addSpecField = () => {
    if (specifications.length < 10) {
      setSpecifications([...specifications, { label: '', value: '' }])
    }
  }

  const removeSpecField = (index) => {
    setSpecifications(specifications.filter((_, i) => i !== index))
  }

  // Handle Image File selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      }))
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: 'File size exceeds the 2 MB limit.',
      }))
      return
    }

    setErrors((prev) => {
      const copy = { ...prev }
      delete copy.image
      return copy
    })
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    setServerError(null)

    const cleanedCompatibility = compatibilityText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const cleanedHighlights = highlights.map((h) => h.trim()).filter(Boolean)
    const cleanedSpecifications = specifications
      .filter((s) => s.label.trim() && s.value.trim())
      .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))

    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      category,
      price: parseFloat(price),
      mrp: parseFloat(mrp),
      stock: parseInt(stock, 10),
      status,
      compatibility: cleanedCompatibility,
      short_description: shortDescription.trim(),
      highlights: cleanedHighlights,
      specifications: cleanedSpecifications,
    }

    try {
      let saved = null
      if (isEdit) {
        const res = await updateAdminProduct(productToEdit.id, payload)
        saved = res.product
      } else {
        const res = await createAdminProduct(payload)
        saved = res.product
      }

      // If an image was selected, upload it
      if (imageFile && saved?.id) {
        try {
          const imgRes = await uploadProductImage(saved.id, imageFile)
          if (imgRes.imageUrl) {
            saved.image = imgRes.imageUrl
            saved.imageUrl = imgRes.imageUrl
          }
        } catch (imgErr) {
          console.warn('[ProductDrawer] Image upload warning:', imgErr.message)
        }
      }

      onProductSaved(saved)
      onClose()
    } catch (err) {
      setServerError(err.message || 'Failed to save product.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto p-6 sm:p-8 flex flex-col justify-between shadow-2xl z-10">
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                {isEdit ? 'Edit Component' : 'Add New Component'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isEdit
                  ? `Updating catalog specifications for ${productToEdit.name}`
                  : 'Add a new performance motorcycle part to the AirTouch catalog.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {serverError && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Form Body */}
          <form id="product-form" onSubmit={handleSubmit} className="py-6 space-y-6">
            {/* 1. Name & Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Titan-X Titanium Slip-On Performance Exhaust"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
                {errors.name && <p className="text-[11px] text-red-400">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. AirTouch Apex"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* 2. Category & Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Stock Units *
                </label>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-mono"
                />
                {errors.stock && <p className="text-[11px] text-red-400">{errors.stock}</p>}
              </div>
            </div>

            {/* 3. Pricing in Rupees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 4999"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-mono"
                />
                {errors.price && <p className="text-[11px] text-red-400">{errors.price}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Original MRP (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="e.g. 6499"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-mono"
                />
                {errors.mrp && <p className="text-[11px] text-red-400">{errors.mrp}</p>}
              </div>
            </div>

            {/* 4. Status / Storefront Visibility */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Storefront Visibility / Status *
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="inline-flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 text-xs font-semibold self-start">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                        : 'text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('hidden')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      status === 'hidden'
                        ? 'bg-zinc-800 text-zinc-200 border border-zinc-700 shadow-sm'
                        : 'text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    Hidden
                  </button>
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  {status === 'active' ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                      Visible on storefront
                    </span>
                  ) : (
                    <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block"></span>
                      Hidden from storefront
                    </span>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Hidden products are not shown on the storefront.
              </p>
            </div>

            {/* 5. Image Upload & Preview */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Product Image (JPEG, PNG, WebP — max 2 MB)
              </label>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="w-16 h-16 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer transition-colors border border-zinc-700">
                    <Upload className="w-3.5 h-3.5 text-orange-400" />
                    <span>Choose Image File</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Upload to secure Supabase Storage bucket &ldquo;product-images&rdquo;.
                  </p>
                </div>
              </div>
              {errors.image && <p className="text-[11px] text-red-400">{errors.image}</p>}
            </div>

            {/* 5. Short Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Short Description
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Compact overview of build metallurgy, design benefits, and track pedigree..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* 6. Motorcycle Compatibility */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Compatibility Models (one per line)
              </label>
              <textarea
                rows={3}
                value={compatibilityText}
                onChange={(e) => setCompatibilityText(e.target.value)}
                placeholder="KTM Duke 390&#10;Kawasaki Z900&#10;Royal Enfield Continental GT 650"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none font-mono"
              />
            </div>

            {/* 7. Highlights (up to 5) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Highlights ({highlights.length}/5)
                </label>
                {highlights.length < 5 && (
                  <button
                    type="button"
                    onClick={addHighlightField}
                    className="text-xs text-orange-400 hover:text-orange-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Bullet</span>
                  </button>
                )}
              </div>
              {highlights.map((h, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => handleHighlightChange(idx, e.target.value)}
                    placeholder={`Highlight bullet ${idx + 1}`}
                    className="flex-1 px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                  {highlights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHighlightField(idx)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {errors.highlights && <p className="text-[11px] text-red-400">{errors.highlights}</p>}
            </div>

            {/* 8. Specifications (up to 10 label-value rows) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Specifications ({specifications.length}/10)
                </label>
                {specifications.length < 10 && (
                  <button
                    type="button"
                    onClick={addSpecField}
                    className="text-xs text-orange-400 hover:text-orange-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                )}
              </div>
              {specifications.map((spec, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={spec.label}
                    onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                    placeholder="Spec label (e.g. Material)"
                    className="col-span-5 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    placeholder="Value (e.g. 6061-T6 Billet)"
                    className="col-span-6 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                  {specifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpecField(idx)}
                      className="col-span-1 p-2 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer flex justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {errors.specifications && (
                <p className="text-[11px] text-red-400">{errors.specifications}</p>
              )}
            </div>
          </form>
        </div>

        {/* Drawer Actions Footer */}
        <div className="pt-6 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs uppercase tracking-wider transition-colors border border-zinc-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-orange-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Saving Component...</span>
              </>
            ) : (
              <span>{isEdit ? 'Save Changes' : 'Create Component'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
