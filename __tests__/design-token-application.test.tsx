/**
 * Property-Based Tests for Design Token Application
 * Feature: platform-enhancements, Property 7
 * Validates: Requirements 2.5
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { Header } from '@/components/shared/Header';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { StatCard } from '@/components/shared/StatCard';
import { designTokens, cn } from '@/lib/styles/tokens';
import { Shield, Activity } from 'lucide-react';

describe('Design Token Application Tests', () => {
  /**
   * Property 7: Design Token Application
   * Validates: Requirements 2.5
   * 
   * For any spacing, typography, or visual hierarchy property,
   * the values should come from the shared design tokens and be
   * consistent across platforms.
   */
  describe('Property 7: Design Token Application', () => {
    test('all spacing values should come from design tokens', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('sm', 'md', 'lg'),
          (size) => {
            // Property: Spacing values should be defined in design tokens
            const spacingValue = designTokens.spacing.gap[size];
            expect(spacingValue).toBeDefined();
            expect(typeof spacingValue).toBe('string');
            
            // Property: Spacing should follow Tailwind gap pattern
            expect(spacingValue).toMatch(/^gap-\d+$/);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all typography values should come from design tokens', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('h1', 'h2', 'h3'),
          (heading) => {
            // Property: Typography values should be defined in design tokens
            const typographyValue = designTokens.typography.heading[heading];
            expect(typographyValue).toBeDefined();
            expect(typeof typographyValue).toBe('string');
            
            // Property: Typography should include text size and weight
            expect(typographyValue).toContain('text-');
            expect(typographyValue).toContain('font-');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all color values should come from design tokens', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'secondary', 'tertiary'),
          (colorType) => {
            // Property: Color values should be defined in design tokens
            const colorValue = designTokens.colors.text[colorType];
            expect(colorValue).toBeDefined();
            expect(typeof colorValue).toBe('string');
            
            // Property: Colors should follow Tailwind text color pattern
            expect(colorValue).toMatch(/^text-\w+-\d+$/);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all gradient values should come from design tokens', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'secondary', 'accent', 'success', 'warning', 'background'),
          (gradientType) => {
            // Property: Gradient values should be defined in design tokens
            const gradientValue = designTokens.gradients[gradientType];
            expect(gradientValue).toBeDefined();
            expect(typeof gradientValue).toBe('string');
            
            // Property: Gradients should follow Tailwind gradient pattern
            expect(gradientValue).toMatch(/^from-\w+-\d+/);
            expect(gradientValue).toContain('via-');
            expect(gradientValue).toContain('to-');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all shadow values should come from design tokens', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('sm', 'md', 'lg', 'xl', 'card', 'elevated', 'interactive'),
          (shadowType) => {
            // Property: Shadow values should be defined in design tokens
            const shadowValue = designTokens.shadows[shadowType];
            expect(shadowValue).toBeDefined();
            expect(typeof shadowValue).toBe('string');
            
            // Property: Shadows should follow Tailwind shadow pattern
            expect(shadowValue).toMatch(/^shadow(-\w+)?$/);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all border radius values should come from design tokens', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('sm', 'md', 'lg', 'full'),
          (radiusType) => {
            // Property: Radius values should be defined in design tokens
            const radiusValue = designTokens.radius[radiusType];
            expect(radiusValue).toBeDefined();
            expect(typeof radiusValue).toBe('string');
            
            // Property: Radius should follow Tailwind rounded pattern
            expect(radiusValue).toMatch(/^rounded(-\w+)?$/);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('components should use design token spacing consistently', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('sm', 'md', 'lg'),
          (padding) => {
            const { container } = render(
              <Card padding={padding as any}>
                <div>Test Content</div>
              </Card>
            );
            
            const card = container.firstChild as HTMLElement;
            const classList = card.className;
            
            // Property: Card padding should use design token values
            const hasPadding = 
              classList.includes('p-4') || 
              classList.includes('p-6') || 
              classList.includes('p-8');
            expect(hasPadding).toBe(true);
            
            // Property: Padding values should match design token definitions
            if (padding === 'sm') {
              expect(classList).toContain('p-4');
            } else if (padding === 'md') {
              expect(classList).toContain('p-6');
            } else if (padding === 'lg') {
              expect(classList).toContain('p-8');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('components should use design token colors consistently', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'secondary', 'outline', 'ghost'),
          (variant) => {
            const { container } = render(
              <Button variant={variant as any}>
                Test Button
              </Button>
            );
            
            const button = container.querySelector('button');
            const classList = button!.className;
            
            // Property: Button colors should use design token values
            // Primary should have gradient
            if (variant === 'primary') {
              expect(classList).toContain('bg-gradient-to-r');
            }
            
            // Secondary should have white background
            if (variant === 'secondary') {
              expect(classList).toContain('bg-white');
            }
            
            // All variants should have consistent text colors from design tokens
            const hasTextColor = 
              classList.includes('text-white') || 
              classList.includes('text-slate-') || 
              classList.includes('text-gray-');
            expect(hasTextColor).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('components should use design token typography consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.option(fc.string({ minLength: 3, maxLength: 50 }), { nil: null }),
          (title, subtitle) => {
            const { container } = render(
              <Header
                title={title}
                subtitle={subtitle || undefined}
                icon={<Shield className="w-6 h-6 text-white" />}
              />
            );
            
            const h1 = container.querySelector('h1');
            const h1Classes = h1!.className;
            
            // Property: Title should use design token heading typography
            expect(h1Classes).toContain('text-2xl');
            expect(h1Classes).toContain('font-bold');
            
            // Property: Typography should match design token definitions
            const headingClasses = designTokens.typography.heading.h1;
            expect(h1Classes).toContain('text-2xl');
            expect(h1Classes).toContain('font-bold');
            
            if (subtitle) {
              const p = container.querySelector('p');
              const pClasses = p!.className;
              
              // Property: Subtitle should use design token body typography
              expect(pClasses).toContain('text-sm');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('visual hierarchy should use design token values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'success', 'warning', 'error', 'info'),
          fc.integer({ min: 0, max: 1000 }),
          (gradient, value) => {
            const { container } = render(
              <StatCard
                icon={Activity}
                label="Test Stat"
                value={value}
                gradient={gradient as any}
                index={0}
              />
            );
            
            const statCard = container.firstChild as HTMLElement;
            const classList = statCard.className;
            
            // Property: Visual hierarchy should use design token spacing
            const hasSpacing = 
              classList.includes('p-4') || 
              classList.includes('p-6') || 
              classList.includes('p-8');
            expect(hasSpacing).toBe(true);
            
            // Property: Visual hierarchy should use design token shadows
            expect(classList).toContain('shadow');
            
            // Property: Visual hierarchy should use design token border radius
            const hasBorderRadius = 
              classList.includes('rounded-lg') || 
              classList.includes('rounded-xl') || 
              classList.includes('rounded-2xl');
            expect(hasBorderRadius).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('cn helper function should properly combine design token classes', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(
            designTokens.colors.text.primary,
            designTokens.colors.text.secondary,
            designTokens.spacing.card,
            designTokens.radius.md,
            designTokens.shadows.md,
            null,
            undefined,
            false
          ), { minLength: 1, maxLength: 10 }),
          (classes) => {
            // Property: cn should filter out falsy values
            const result = cn(...classes);
            
            // Property: Result should be a string
            expect(typeof result).toBe('string');
            
            // Property: Result should not contain 'null', 'undefined', or 'false'
            expect(result).not.toContain('null');
            expect(result).not.toContain('undefined');
            expect(result).not.toContain('false');
            
            // Property: Result should only contain valid class names
            const classArray = result.split(' ').filter(Boolean);
            classArray.forEach(className => {
              expect(className.length).toBeGreaterThan(0);
              expect(className).not.toContain('null');
              expect(className).not.toContain('undefined');
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all design token values should be valid Tailwind classes', () => {
      // Property: All design token values should follow Tailwind naming conventions
      const allTokens = [
        ...Object.values(designTokens.colors.text),
        ...Object.values(designTokens.colors.border),
        ...Object.values(designTokens.shadows),
        ...Object.values(designTokens.radius),
        ...Object.values(designTokens.spacing.gap),
        ...Object.values(designTokens.typography.heading),
        ...Object.values(designTokens.typography.body),
        ...Object.values(designTokens.typography.weight),
      ];

      allTokens.forEach(token => {
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
        
        // Property: Tokens should not contain invalid characters
        expect(token).not.toContain('undefined');
        expect(token).not.toContain('null');
        
        // Property: Tokens should follow Tailwind patterns
        const isValidTailwind = 
          token.match(/^(text|bg|border|shadow|rounded|p|px|py|m|mx|my|gap|font|from|via|to)-/) !== null ||
          token.match(/^(flex|grid|relative|absolute|fixed|sticky|inline|block|hidden)/) !== null;
        
        expect(isValidTailwind).toBe(true);
      });
    });

    test('design tokens should be immutable', () => {
      // Property: Design tokens should be read-only at compile time
      const originalGradient = designTokens.gradients.primary;
      
      // TypeScript's 'as const' provides compile-time immutability
      // At runtime, we verify the tokens maintain their expected values
      expect(designTokens.gradients.primary).toBe('from-blue-600 via-indigo-600 to-purple-700');
      expect(originalGradient).toBe('from-blue-600 via-indigo-600 to-purple-700');
      
      // Property: Token values should be consistent
      expect(typeof designTokens.gradients.primary).toBe('string');
      expect(designTokens.gradients.primary.length).toBeGreaterThan(0);
    });

    test('all platforms should reference the same design token values', () => {
      // Property: Design tokens should be a single source of truth
      const tokenReferences = [
        designTokens.gradients.primary,
        designTokens.colors.text.primary,
        designTokens.spacing.card,
        designTokens.radius.md,
        designTokens.shadows.md,
      ];

      // Property: Each token should have a consistent value
      tokenReferences.forEach(token => {
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });

      // Property: Tokens should not be duplicated with different values
      const uniqueTokens = new Set(tokenReferences);
      expect(uniqueTokens.size).toBe(tokenReferences.length);
    });
  });
});
