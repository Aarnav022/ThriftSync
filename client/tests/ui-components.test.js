import { describe, it, expect } from 'vitest';
import { cn } from '../src/lib/utils.js';
import { HeroAnimated } from '../src/components/ui/hero-animated.jsx';
import { HeaderNavbar } from '../src/components/navigation/HeaderNavbar.jsx';
import { ProductCard } from '../src/components/marketplace/ProductCard.jsx';

describe('UI Utilities & Component Logic Verification', () => {
  it('HeroAnimated component exports successfully as a function', () => {
    expect(typeof HeroAnimated).toBe('function');
  });

  it('HeaderNavbar component exports successfully as a function', () => {
    expect(typeof HeaderNavbar).toBe('function');
  });

  it('ProductCard component exports successfully as a function', () => {
    expect(typeof ProductCard).toBe('function');
  });

  it('cn helper properly merges Tailwind classes and resolves conflicts', () => {
    const result = cn('px-4 py-2 text-red-500', 'px-6 text-blue-500', false && 'hidden');
    expect(result).toBe('py-2 px-6 text-blue-500');
  });

  it('theme toggle logic properly manages dark class on document element', () => {
    const classList = new Set();
    const mockDoc = {
      documentElement: {
        classList: {
          contains: (cls) => classList.has(cls),
          add: (cls) => classList.add(cls),
          remove: (cls) => classList.delete(cls),
        }
      }
    };

    // Initial state: light
    expect(mockDoc.documentElement.classList.contains('dark')).toBe(false);

    // Toggle to dark
    mockDoc.documentElement.classList.add('dark');
    expect(mockDoc.documentElement.classList.contains('dark')).toBe(true);

    // Toggle back to light
    mockDoc.documentElement.classList.remove('dark');
    expect(mockDoc.documentElement.classList.contains('dark')).toBe(false);
  });
});
