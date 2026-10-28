import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye } from 'lucide-react';

export function PrivacyPage({ onBack }) {
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
            <Lock className="size-4" />
            <span>DPDP Aligned Security</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-2 border-b border-stone-200 dark:border-stone-800 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sustainability/10 border border-sustainability/20 text-sustainability text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="size-3.5" />
            <span>Student Privacy Commitment</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight">
            Privacy Policy & Data Protection
          </h1>
          <p className="text-xs text-stone-500">
            Last Updated: 28 October 2026 • Aligned with the Digital Personal Data Protection Act, 2023 (India)
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">1. Information We Collect</h2>
            <p>
              To provide a safe peer marketplace, ThriftSync collects only minimal necessary data:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Credentials:</strong> Full name, university email address, and encrypted password hash.</li>
              <li><strong>Campus Identity:</strong> Affiliated college, campus, and profile avatar (optional).</li>
              <li><strong>Fulfillment Information:</strong> Delivery street address, hostel details, 6-digit Indian PIN code, and contact phone number.</li>
              <li><strong>Transaction Records:</strong> Orders placed, items sold, circular swaps, rentals, and payments history.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">2. Password Security & Cryptography</h2>
            <p>
              Your passwords are never stored in plain text. ThriftSync enforces salted cryptographic hashing using <code>bcrypt</code> with a minimum work factor of 10. Passwords are automatically stripped from all server API responses.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">3. Payment Information Isolation</h2>
            <p>
              ThriftSync does not collect, process, or store credit card numbers, debit card numbers, CVVs, or UPI PINs. Online transactions are processed directly by our PCI-DSS compliant payment gateway partner (Razorpay). Webhook notifications sent to our servers only convey verified payment success or failure events.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">4. What Other Students Can See</h2>
            <p>
              To maintain peer trust while safeguarding student privacy:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Other campus students can only see your public name, campus, published listings, and verified trust badge.</li>
              <li>Your personal email, phone number, and residential dorm details remain strictly private and are only revealed to your delivery partner or transaction counterpart once an order is confirmed.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">5. Informed Consent & Right to Withdraw</h2>
            <p>
              By signing up on ThriftSync, you provide informed consent for processing your personal data strictly for peer authentication, catalog interaction, and order delivery. You hold the right to withdraw your consent at any time by contacting our Grievance Officer or closing your account. Upon withdrawal, your account will be deactivated and processing terminated, except where retention is legally required.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">6. Data Principal Rights (DPDP Act 2023)</h2>
            <p>
              As a Data Principal under the Digital Personal Data Protection Act, 2023, you are entitled to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Right of Access:</strong> Request a summary of your personal data processed by ThriftSync.</li>
              <li><strong>Right to Correction & Updating:</strong> Correct, update, or complete any inaccurate profile details directly via Account Settings.</li>
              <li><strong>Right to Erasure:</strong> Request the deletion of your personal data when it is no longer required for the purpose for which it was collected.</li>
              <li><strong>Right to Nominate:</strong> Nominate another individual to exercise your rights in the event of death or incapacity.</li>
              <li><strong>Right of Grievance Redressal:</strong> Submit grievances regarding data processing to our designated officer.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">7. Data Retention & Purpose Limitation</h2>
            <p>
              Personal data is retained only as long as your campus account remains active and necessary to fulfill transactions. Order payment records and financial invoicing are retained for statutory retention periods under applicable Indian fiscal and accounting laws, after which data is securely erased or anonymized.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-text">8. Cookies and Local Storage</h2>
            <p>
              We use secure tokens and local browser storage strictly for session authentication and temporary guest shopping bag persistence. We do not employ third-party tracking or advertising pixels.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 text-[11px] text-stone-500">
            <strong>Grievance Redressal Officer:</strong> In compliance with the DPDP Act 2023, you may contact our Grievance Officer at <code>grievance@thriftsync.in</code>. All data inquiries and erasure requests are acknowledged within 48 hours and resolved within 30 calendar days.
          </section>
        </div>
      </main>
    </div>
  );
}

export default PrivacyPage;
