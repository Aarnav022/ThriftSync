import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, RefreshCw } from 'lucide-react';

/**
 * Animated Ambient Hero component adapted from 21st.dev (ohmfordev/hero).
 * Converted to pure React 19 JSX and aligned with ThriftSync's sustainable editorial tokens.
 */
export function HeroAnimated({
  badgeText = '🌱 Campus & Local Community Marketplace',
  badgeLink = '#',
  title = 'Buy, Sell, Rent & Swap on Campus',
  subtitle = 'Give clothes, textbooks, and gear a second life. Reduce campus waste while saving money with verified peers.',
  primaryAction = {
    label: 'Explore Marketplace',
    href: '/listings',
  },
  secondaryAction = {
    label: 'Rent or Swap Gear',
    href: '/rentals',
  },
  metrics = [
    { label: 'Campus Verified', value: '100%' },
    { label: 'Sustainable Savings', value: 'Up to 70%' },
    { label: 'Carbon Diverted', value: 'Zero Waste Goal' },
  ],
  className = '',
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section
      className={`relative overflow-hidden bg-background py-20 md:py-28 text-text ${className}`}
      aria-label="Marketplace Hero"
    >
      {/* Ambient Animated Gradient Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 25, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-sustainability/10 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, 25, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-rental/10 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.05, 0.12, 0.05],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-20 left-1/3 h-80 w-80 rounded-full bg-surface blur-2xl"
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* Badge */}
          {badgeText && (
            <motion.div variants={itemVariants} className="mb-6">
              <a
                href={badgeLink}
                className="inline-flex items-center gap-2 rounded-full border border-sustainability/20 bg-surface/80 px-4 py-1.5 text-xs sm:text-sm font-medium text-sustainability backdrop-blur transition-colors hover:border-sustainability/40 hover:bg-surface"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{badgeText}</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </motion.div>
          )}

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-text leading-[1.15]"
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-2xl text-base sm:text-lg text-text/80 leading-relaxed"
          >
            {subtitle}
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            {primaryAction && (
              <a
                href={primaryAction.href}
                onClick={primaryAction.onClick}
                className="inline-flex items-center gap-2 rounded-lg bg-sustainability px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sustainability/90 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sustainability"
              >
                <span>{primaryAction.label}</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            )}

            {secondaryAction && (
              <a
                href={secondaryAction.href}
                onClick={secondaryAction.onClick}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-surface px-6 py-3 text-sm font-semibold text-text shadow-sm transition-all hover:border-rental hover:text-rental hover:bg-surface/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rental"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{secondaryAction.label}</span>
              </a>
            )}
          </motion.div>

          {/* Trust & Impact Metrics */}
          {metrics && metrics.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="mt-14 w-full max-w-3xl border-t border-stone-200/80 pt-8"
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {metrics.map((m, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-xl sm:text-2xl font-bold text-text">
                      {m.value}
                    </span>
                    <span className="mt-1 text-xs text-text/70 uppercase tracking-wider">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default HeroAnimated;
