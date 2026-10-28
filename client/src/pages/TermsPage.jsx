import React from 'react';
import { ArrowLeft, ShieldCheck, Scale, FileText } from 'lucide-react';

export function TermsPage({ onBack }) {
  return (
    <div className="min-h-screen bg-background text-text selection:bg-sustainability/20">
      {/* Top Header */}
      <header className="border-b border-stone-200 dark:border-stone-800 bg-surface/80 dark:bg-[#1E1D1B]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack || (() => window.history.back())}
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-text transition"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Marketplace</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-sustainability">
            <ShieldCheck className="size-4" />
            <span>ThriftSync Verified Platform</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-2 border-b border-stone-200 dark:border-stone-800 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sustainability/10 border border-sustainability/20 text-sustainability text-xs font-bold uppercase tracking-wider">
            <Scale className="size-3.5" />
            <span>Campus Marketplace Rules</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight">
            Terms and Conditions of Service
          </h1>
          <p className="text-xs text-stone-500">
            Last Updated: 28 October 2026 • Effective for all ThriftSync India campus users
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">1. Campus Community Eligibility</h2>
            <p>
              ThriftSync is an exclusive, hyperlocal marketplace designed for students, faculty, and affiliated residents of participating university campuses. By creating an account, you confirm that you are at least 18 years of age and hold active academic credentials.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">2. Product Pricing & Currency</h2>
            <p>
              All prices, charges, security deposits, and monetary values are strictly denominated and processed in Indian Rupees (INR). Authoritative calculations are evaluated on the backend server. Displayed catalog prices include all applicable base charges.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">3. Delivery Charges & Free Shipping Threshold</h2>
            <p>
              Deliveries within the campus perimeter carry a flat shipping charge of <strong>₹49</strong>. Orders with an item subtotal of <strong>₹499 or higher</strong> qualify automatically for <strong>FREE campus delivery</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">4. Cash on Delivery (COD) Policy</h2>
            <p>
              To protect peer sellers and minimize delivery refusals, Cash on Delivery (COD) is available only for orders up to a maximum value of <strong>₹5,000</strong>. Orders exceeding ₹5,000 must be settled via authorized online payment methods (UPI, debit/credit cards, net banking).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">5. Two-Phase Stock Reservation</h2>
            <p>
              When initiating checkout, requested inventory is temporarily reserved for <strong>15 minutes</strong> to prevent double-booking. If payment is not completed or verified within this 15-minute window, the reservation is automatically released back to the general campus inventory.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">6. Pre-Shipment Order Cancellation & Refunds</h2>
            <p>
              Buyers may cancel any order before it is marked as shipped by the seller or courier. For online prepaid orders cancelled prior to shipment, a full refund is automatically initiated to the original payment source. Once an order is marked as <strong>SHIPPED</strong>, pre-shipment cancellation is closed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">7. Circular Swaps & Campus Rentals</h2>
            <p>
              Peer-to-peer swaps are executed with zero cash consideration. Rental listings require a clearly separated rental fee and a refundable security deposit. Security deposits are refunded upon verified return of the rented item in its original stated condition.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">8. Designated Safe Handover Checkpoints</h2>
            <p>
              In accordance with campus security protocols, in-person exchanges must be conducted at designated public campus checkpoints (Campus Student Center, Main Library, Dining Commons Atrium, or Residential Quad Desk). Private dorm room numbers and personal residences must never be published publicly.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">9. Prohibited Items & Content Moderation</h2>
            <p>
              Users may not post prohibited, counterfeit, pirated, or hazardous materials. ThriftSync moderators reserve the right to suspend any listing or deactivate accounts violating campus conduct guidelines.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 text-[11px] text-stone-500">
            <strong>Legal Disclaimer:</strong> These terms are provided for operational governance of the ThriftSync campus MVP. Final terms must undergo formal review by qualified legal counsel in India prior to commercial public rollout.
          </section>
        </div>
      </main>
    </div>
  );
}

export default TermsPage;
