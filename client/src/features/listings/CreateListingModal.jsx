import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, DollarSign, Clock, ShieldCheck, Repeat, AlertCircle, Loader2, Sparkles, MapPin, ImagePlus, Trash2 } from 'lucide-react';
import { createListing } from './listingService.js';
import { useAuth } from '../authentication/authContext.jsx';
import { uploadMultipleImages, validateImageFile } from '../uploads/uploadService.js';

export function CreateListingModal({ isOpen, onClose, onListingCreated }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Textbooks',
    condition: 'Excellent',
    listingType: 'buy',
    price: '',
    rentalRate: '',
    rentalPeriod: 'per semester',
    deposit: '',
    swapFor: '',
    campus: user?.campus || 'Main Campus',
    pickupLocation: 'Campus Student Center',
  });

  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      setFieldErrors({});
      setUploadedImages([]);
      setUploadError(null);
      setFormData((prev) => ({
        ...prev,
        campus: user?.campus || 'Main Campus',
      }));
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errors = {};

    if (!formData.title || formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 120) {
      errors.title = 'Title cannot exceed 120 characters';
    }

    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (formData.listingType === 'buy' || formData.listingType === 'buy_and_rent') {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.price = 'Please provide a valid price (non-negative)';
      }
    }

    if (formData.listingType === 'rent' || formData.listingType === 'buy_and_rent') {
      const rentalNum = parseFloat(formData.rentalRate);
      if (isNaN(rentalNum) || rentalNum < 0) {
        errors.rentalRate = 'Please provide a valid rental rate';
      }
      if (formData.deposit !== '' && formData.deposit !== null) {
        const depNum = parseFloat(formData.deposit);
        if (isNaN(depNum) || depNum < 0) {
          errors.deposit = 'Deposit must be non-negative';
        }
      }
    }

    if (formData.listingType === 'swap') {
      if (!formData.swapFor || formData.swapFor.trim().length === 0) {
        errors.swapFor = 'Please specify what item you are seeking in exchange';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadError(null);

    if (uploadedImages.length + files.length > 5) {
      setUploadError('Maximum 5 images allowed per listing.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    for (const f of files) {
      const v = validateImageFile(f);
      if (!v.valid) {
        setUploadError(v.error);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setIsUploadingImages(true);
    try {
      const uploaded = await uploadMultipleImages(files);
      const newUrls = uploaded.map((u) => u.url);
      setUploadedImages((prev) => [...prev, ...newUrls]);
    } catch (err) {
      setUploadError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        condition: formData.condition,
        listingType: formData.listingType,
        campus: formData.campus.trim(),
        pickupLocation: formData.pickupLocation.trim(),
        images: uploadedImages,
      };

      if (formData.listingType === 'buy' || formData.listingType === 'buy_and_rent') {
        payload.price = parseFloat(formData.price);
      }
      if (formData.listingType === 'rent' || formData.listingType === 'buy_and_rent') {
        payload.rentalRate = parseFloat(formData.rentalRate);
        payload.rentalPeriod = formData.rentalPeriod;
        payload.deposit = formData.deposit ? parseFloat(formData.deposit) : 0;
      }
      if (formData.listingType === 'swap') {
        payload.swapFor = formData.swapFor.trim();
      }

      const created = await createListing(payload);
      if (onListingCreated) {
        onListingCreated(created);
      }
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to publish listing. Please check input values.');
      if (err.errors) {
        const mapped = {};
        err.errors.forEach((e) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-listing-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl my-8 bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative text-text animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          aria-label="Close modal"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sustainability/10 border border-sustainability/20 text-sustainability dark:text-green-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="size-3.5" />
            <span>Campus Circular Economy</span>
          </div>
          <h2 id="create-listing-title" className="text-2xl font-black tracking-tight text-text">
            List an Item on Campus
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Rehome pre-owned textbooks, clothes or dorm gear directly to fellow students.
          </p>
        </div>

        {/* Global error alert */}
        {serverError && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-500" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label htmlFor="listing-title" className="block font-bold mb-1 text-text">
              Listing Title <span className="text-red-500">*</span>
            </label>
            <input
              id="listing-title"
              type="text"
              required
              placeholder="e.g. Principles of Economics (10th Ed) or Vintage Campus Hoodie"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-background border ${
                fieldErrors.title ? 'border-red-500' : 'border-stone-300 dark:border-stone-700'
              } text-text text-sm focus:outline-none focus:ring-2 focus:ring-sustainability`}
            />
            {fieldErrors.title && <p className="text-red-500 text-[11px] mt-1">{fieldErrors.title}</p>}
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="listing-category" className="block font-bold mb-1 text-text">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="listing-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-text text-xs focus:outline-none focus:ring-2 focus:ring-sustainability"
              >
                <option value="Textbooks">Textbooks</option>
                <option value="Fashion">Fashion & Clothing</option>
                <option value="Electronics">Electronics & Tech</option>
                <option value="Dorm & Living">Dorm & Living</option>
                <option value="Other">Other Goods</option>
              </select>
            </div>

            <div>
              <label htmlFor="listing-condition" className="block font-bold mb-1 text-text">
                Condition <span className="text-red-500">*</span>
              </label>
              <select
                id="listing-condition"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-text text-xs focus:outline-none focus:ring-2 focus:ring-sustainability"
              >
                <option value="Like New">Like New (flawless)</option>
                <option value="Excellent">Excellent (minor signs of use)</option>
                <option value="Good">Good (fully functional, cosmetic wear)</option>
                <option value="Fair">Fair (well used)</option>
              </select>
            </div>
          </div>

          {/* Image Upload Pipeline */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="listing-photos-input" className="block font-bold text-text">
                Photos <span className="text-stone-400 font-normal">({uploadedImages.length}/5)</span>
              </label>
              <span className="text-[10px] text-stone-500 dark:text-stone-400">Max 5MB each (JPG, PNG, WebP)</span>
            </div>

            {uploadError && (
              <div className="mb-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Existing Uploaded Thumbnails */}
              {uploadedImages.map((imgUrl, index) => (
                <div
                  key={index}
                  className="relative group size-16 sm:size-20 rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 shadow-sm shrink-0"
                >
                  <img
                    src={imgUrl}
                    alt={`Item preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-red-600 text-white transition opacity-90 group-hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}

              {/* Upload Action / Drop Area */}
              {uploadedImages.length < 5 && (
                <label
                  htmlFor="listing-photos-input"
                  className={`size-16 sm:size-20 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-sustainability dark:hover:border-green-400 flex flex-col items-center justify-center cursor-pointer transition bg-background hover:bg-stone-50 dark:hover:bg-stone-800/50 shrink-0 ${
                    isUploadingImages ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {isUploadingImages ? (
                    <Loader2 className="size-5 animate-spin text-sustainability" />
                  ) : (
                    <>
                      <ImagePlus className="size-5 text-stone-400 group-hover:text-sustainability mb-0.5" />
                      <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">Add</span>
                    </>
                  )}
                  <input
                    id="listing-photos-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    disabled={isUploadingImages}
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Listing Type Selector */}
          <div>
            <label className="block font-bold mb-1.5 text-text">
              Availability Model <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'buy', label: 'Buy Only', icon: Tag },
                { id: 'rent', label: 'Rent Only', icon: Clock },
                { id: 'buy_and_rent', label: 'Buy or Rent', icon: ShieldCheck },
                { id: 'swap', label: 'Direct Swap', icon: Repeat },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = formData.listingType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, listingType: opt.id })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
                      isSelected
                        ? 'border-sustainability bg-sustainability/10 text-sustainability dark:text-green-400 font-bold'
                        : 'border-stone-300 dark:border-stone-700 bg-background text-stone-600 dark:text-stone-400 hover:border-stone-400'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing Fields depending on type */}
          {(formData.listingType === 'buy' || formData.listingType === 'buy_and_rent') && (
            <div>
              <label htmlFor="listing-price" className="block font-bold mb-1 text-text">
                Purchase Price ($ USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold text-sm">$</span>
                <input
                  id="listing-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="25.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-background border ${
                    fieldErrors.price ? 'border-red-500' : 'border-stone-300 dark:border-stone-700'
                  } text-text text-sm focus:outline-none focus:ring-2 focus:ring-sustainability`}
                />
              </div>
              {fieldErrors.price && <p className="text-red-500 text-[11px] mt-1">{fieldErrors.price}</p>}
            </div>
          )}

          {/* Rental Fields (rate + refundable deposit tracked separately per AGENTS.md) */}
          {(formData.listingType === 'rent' || formData.listingType === 'buy_and_rent') && (
            <div className="p-3.5 rounded-2xl bg-rental/5 border border-rental/20 space-y-3">
              <div className="flex items-center justify-between text-rental dark:text-orange-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" /> Rental & Deposit Terms
                </span>
                <span className="text-[10px] uppercase tracking-wide bg-rental/10 px-2 py-0.5 rounded">
                  Separated Accounting
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="listing-rental-rate" className="block font-semibold mb-1 text-text">
                    Rental Charge ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="listing-rental-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="8.00"
                    value={formData.rentalRate}
                    onChange={(e) => setFormData({ ...formData, rentalRate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl bg-background border ${
                      fieldErrors.rentalRate ? 'border-red-500' : 'border-stone-300 dark:border-stone-700'
                    } text-text text-xs focus:outline-none focus:ring-2 focus:ring-rental`}
                  />
                  {fieldErrors.rentalRate && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.rentalRate}</p>}
                </div>

                <div>
                  <label htmlFor="listing-rental-period" className="block font-semibold mb-1 text-text">
                    Period
                  </label>
                  <select
                    id="listing-rental-period"
                    value={formData.rentalPeriod}
                    onChange={(e) => setFormData({ ...formData, rentalPeriod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-text text-xs focus:outline-none focus:ring-2 focus:ring-rental"
                  >
                    <option value="per semester">per semester</option>
                    <option value="per month">per month</option>
                    <option value="per week">per week</option>
                    <option value="per day">per day</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="listing-deposit" className="block font-semibold mb-1 text-text">
                  Refundable Security Deposit ($)
                </label>
                <input
                  id="listing-deposit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-text text-xs focus:outline-none focus:ring-2 focus:ring-rental"
                />
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                  * Refunded in full when item is returned in agreed condition.
                </p>
              </div>
            </div>
          )}

          {/* Swap preference */}
          {formData.listingType === 'swap' && (
            <div className="p-3.5 rounded-2xl bg-sustainability/5 border border-sustainability/20 space-y-2">
              <label htmlFor="listing-swap-for" className="block font-bold text-text">
                Desired Exchange Item <span className="text-red-500">*</span>
              </label>
              <input
                id="listing-swap-for"
                type="text"
                placeholder="e.g. Chemistry Model Kit, TI-84 Plus, or XL Winter Parka"
                value={formData.swapFor}
                onChange={(e) => setFormData({ ...formData, swapFor: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl bg-background border ${
                  fieldErrors.swapFor ? 'border-red-500' : 'border-stone-300 dark:border-stone-700'
                } text-text text-xs focus:outline-none focus:ring-2 focus:ring-sustainability`}
              />
              {fieldErrors.swapFor && <p className="text-red-500 text-[10px] mt-1">{fieldErrors.swapFor}</p>}
            </div>
          )}

          {/* Description */}
          <div>
            <label htmlFor="listing-description" className="block font-bold mb-1 text-text">
              Item Details & Condition Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              id="listing-description"
              required
              rows={3}
              placeholder="Highlight any markings, edition, accessories included, and pickup preferences."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-background border ${
                fieldErrors.description ? 'border-red-500' : 'border-stone-300 dark:border-stone-700'
              } text-text text-xs focus:outline-none focus:ring-2 focus:ring-sustainability resize-none`}
            />
            {fieldErrors.description && <p className="text-red-500 text-[11px] mt-1">{fieldErrors.description}</p>}
          </div>

          {/* Campus & Pickup Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="listing-campus" className="block font-bold mb-1 text-text">
                Campus / Quad
              </label>
              <input
                id="listing-campus"
                type="text"
                value={formData.campus}
                onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-text text-xs"
              />
            </div>
            <div>
              <label htmlFor="listing-pickup" className="block font-bold mb-1 text-text">
                Safe Pickup Location
              </label>
              <input
                id="listing-pickup"
                type="text"
                placeholder="e.g. Student Center or Library Desk"
                value={formData.pickupLocation}
                onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-text text-xs"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-sustainability hover:bg-emerald-800 disabled:opacity-60 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Publishing Listing...</span>
                </>
              ) : (
                <span>Publish Campus Listing</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateListingModal;
