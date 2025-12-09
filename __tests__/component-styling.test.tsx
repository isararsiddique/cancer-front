/**
 * Property-Based Tests for Component Styling Uniformity
 * Feature: platform-enhancements
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { StatCard } from '@/components/shared/StatCard';
import { designTokens } from '@/lib/styles/tokens';
import { Activity } from 'lucide-react';

describe('Component Styling Uniformity Tests', () => {
  /**
   * Property 5: Component Styling Uniformity
   * Validates: Requirements 2.2
   * 
   * For any UI component type (button, card, form, navigation),
   * the CSS classes and styling properties should be identical
   * across all four platforms.
   */
  describe('Property 5: Component Styling Uniformity', () => {
    test('Button component should use consistent design tokens for all variants', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('primary', 'secondary', 'outline', 'ghost'),
          fc.constantFrom('sm', 'md', 'lg'),
          (variant, size) => {
            const { container } = render(
              <Button variant={variant as any} size={size as any}>
                Test Button
              </Button>
            );
            
            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            
            // Property: All buttons should have consistent base classes
            const classList = button!.className;
            
            // Should include design token classes
            expect(classList).toContain('flex');
            expect(classList).toContain('items-center');
            expect(classList).toContain('justify-center');
            
            // Should include border radius from design tokens
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

    test('Card component should consistently apply design token spacing', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('sm', 'md', 'lg'),
          fc.boolean(),
          (padding, gradient) => {
            const { container } = render(
              <Card padding={padding as any} gradient={gradient}>
                <div>Test Content</div>
              </Card>
            );
            
            const card = container.firstChild as HTMLElement;
            expect(card).toBeTruthy();
            
            const classList = card.className;
            
            // Property: All cards should have consistent structural classes
            expect(classList).toContain('rounded');
            expect(classList).toContain('shadow');
            expect(classList).toContain('border');
            
            // Property: Cards should use design token colors
            const hasBackgroundColor = 
              classList.includes('bg-white') || 
              classList.includes('bg-gradient');
            expect(hasBackgroundColor).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('StatCard component should use consistent gradient configurations', () => {
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
            expect(statCard).toBeTruthy();
            
            const classList = statCard.className;
            
            // Property: All stat cards should have consistent layout classes
            expect(classList).toContain('relative');
            expect(classList).toContain('rounded');
            expect(classList).toContain('shadow');
            
            // Property: All stat cards should use design token spacing
            const hasSpacing = 
              classList.includes('p-4') || 
              classList.includes('p-6') || 
              classList.includes('p-8');
            expect(hasSpacing).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all shared components should use design tokens for colors', () => {
      // Property: Components should not use hardcoded colors
      const components = [
        { name: 'Button', component: <Button>Test</Button> },
        { name: 'Card', component: <Card>Test</Card> },
        { name: 'StatCard', component: <StatCard icon={Activity} label="Test" value={100} gradient="primary" /> },
      ];

      components.forEach(({ name, component }) => {
        const { container } = render(component);
        const element = container.firstChild as HTMLElement;
        
        expect(element).toBeTruthy();
        
        // Property: Should not contain inline styles with hardcoded colors
        // (except for specific gradient backgrounds which are calculated)
        const style = element.getAttribute('style');
        if (style && style.includes('background')) {
          // If there's a background style, it should be a gradient calculation
          expect(style).toMatch(/linear-gradient|rgba/);
        }
      });
    });

    test('component border radius should be consistent across all components', () => {
      const radiusValues = Object.values(designTokens.radius);
      
      fc.assert(
        fc.property(
          fc.constantFrom(...radiusValues),
          (radius) => {
            // Property: All radius values should be valid Tailwind classes
            expect(radius).toMatch(/^rounded(-\w+)?$/);
            
            // Property: Radius values should be consistent
            const isValidRadius = [
              'rounded-lg',
              'rounded-xl',
              'rounded-2xl',
              'rounded-full',
            ].includes(radius);
            
            expect(isValidRadius).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('component shadows should use design token definitions', () => {
      const shadowValues = Object.values(designTokens.shadows);
      
      fc.assert(
        fc.property(
          fc.constantFrom(...shadowValues),
          (shadow) => {
            // Property: All shadow values should be valid Tailwind classes
            expect(shadow).toMatch(/^shadow(-\w+)?$/);
            
            // Property: Shadow values should be from the defined set
            const isValidShadow = [
              'shadow-sm',
              'shadow-md',
              'shadow-lg',
              'shadow-xl',
            ].some(validShadow => shadow.includes(validShadow));
            
            expect(isValidShadow).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('typography classes should be consistent across components', () => {
      const typographyClasses = [
        ...Object.values(designTokens.typography.heading),
        ...Object.values(designTokens.typography.body),
        ...Object.values(designTokens.typography.weight),
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...typographyClasses),
          (typographyClass) => {
            // Property: All typography classes should be valid Tailwind classes
            const isValidTypography = 
              typographyClass.startsWith('text-') || 
              typographyClass.startsWith('font-');
            
            expect(isValidTypography).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
