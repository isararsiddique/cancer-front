/**
 * Property-Based Tests for Layout Pattern Consistency
 * Feature: platform-enhancements, Property 6
 * Validates: Requirements 2.3
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { Header } from '@/components/shared/Header';
import { designTokens } from '@/lib/styles/tokens';
import { Shield, FileText, BarChart3, Building2 } from 'lucide-react';

describe('Layout Pattern Consistency Tests', () => {
  /**
   * Property 6: Layout Pattern Consistency
   * Validates: Requirements 2.3
   * 
   * For any header or footer element, the HTML structure and CSS styling
   * should be identical across all four platforms.
   */
  describe('Property 6: Layout Pattern Consistency', () => {
    test('Header component should have consistent structure across all platforms', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            { title: 'UMMC Admin', icon: Shield },
            { title: 'Hospital Platform', icon: FileText },
            { title: 'Research Portal', icon: BarChart3 },
            { title: 'Super Admin', icon: Building2 }
          ),
          fc.string({ minLength: 5, maxLength: 50 }),
          (platform, subtitle) => {
            const Icon = platform.icon;
            const { container } = render(
              <Header
                title={platform.title}
                subtitle={subtitle}
                icon={<Icon className="w-6 h-6 text-white" />}
              />
            );
            
            const nav = container.querySelector('nav');
            expect(nav).toBeTruthy();
            
            // Property: All headers should have consistent positioning classes
            const navClasses = nav!.className;
            expect(navClasses).toContain('sticky');
            expect(navClasses).toContain('top-0');
            expect(navClasses).toContain('z-50');
            
            // Property: All headers should use design token backdrop blur
            expect(navClasses).toContain('backdrop-blur');
            
            // Property: All headers should have consistent border styling
            expect(navClasses).toContain('border-b');
            
            // Property: All headers should have consistent shadow
            const hasShadow = navClasses.includes('shadow');
            expect(hasShadow).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Header icon container should have consistent gradient styling', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(Shield, FileText, BarChart3, Building2),
          fc.string({ minLength: 3, maxLength: 30 }),
          (Icon, title) => {
            const { container } = render(
              <Header
                title={title}
                icon={<Icon className="w-6 h-6 text-white" />}
              />
            );
            
            // Find the icon container div
            const iconContainer = container.querySelector('div[class*="bg-gradient"]');
            expect(iconContainer).toBeTruthy();
            
            const classList = iconContainer!.className;
            
            // Property: Icon container should have consistent size
            expect(classList).toContain('w-12');
            expect(classList).toContain('h-12');
            
            // Property: Icon container should use design token gradient
            expect(classList).toContain('bg-gradient-to-br');
            
            // Property: Icon container should have consistent border radius
            const hasBorderRadius = 
              classList.includes('rounded-xl') || 
              classList.includes('rounded-lg');
            expect(hasBorderRadius).toBe(true);
            
            // Property: Icon container should have consistent shadow
            expect(classList).toContain('shadow');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Header title should use consistent typography tokens', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: null }),
          (title, subtitle) => {
            const { container } = render(
              <Header
                title={title}
                subtitle={subtitle || undefined}
                icon={<Shield className="w-6 h-6 text-white" />}
              />
            );
            
            const h1 = container.querySelector('h1');
            expect(h1).toBeTruthy();
            expect(h1!.textContent).toBe(title);
            
            const h1Classes = h1!.className;
            
            // Property: Title should use design token heading styles
            expect(h1Classes).toContain('text-2xl');
            expect(h1Classes).toContain('font-bold');
            
            // Property: Title should use design token text color
            const hasTextColor = 
              h1Classes.includes('text-slate-900') || 
              h1Classes.includes('text-gray-900');
            expect(hasTextColor).toBe(true);
            
            // If subtitle exists, verify its styling
            if (subtitle) {
              const subtitleElement = container.querySelector('p');
              expect(subtitleElement).toBeTruthy();
              expect(subtitleElement!.textContent).toBe(subtitle);
              
              const subtitleClasses = subtitleElement!.className;
              
              // Property: Subtitle should use consistent text size
              expect(subtitleClasses).toContain('text-sm');
              
              // Property: Subtitle should use design token secondary text color
              const hasSecondaryColor = 
                subtitleClasses.includes('text-slate-600') || 
                subtitleClasses.includes('text-gray-600');
              expect(hasSecondaryColor).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Header container should have consistent spacing', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 50 }),
          (title) => {
            const { container } = render(
              <Header
                title={title}
                icon={<Shield className="w-6 h-6 text-white" />}
              />
            );
            
            const containerDiv = container.querySelector('.container');
            expect(containerDiv).toBeTruthy();
            
            const classList = containerDiv!.className;
            
            // Property: Container should have consistent horizontal padding
            expect(classList).toContain('px-6');
            
            // Property: Container should have consistent vertical padding
            expect(classList).toContain('py-4');
            
            // Property: Container should be centered
            expect(classList).toContain('mx-auto');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Header layout should be consistent regardless of content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          fc.boolean(),
          (title, subtitle, hasActions) => {
            const actions = hasActions ? (
              <button>Action</button>
            ) : undefined;
            
            const { container } = render(
              <Header
                title={title}
                subtitle={subtitle || undefined}
                icon={<Shield className="w-6 h-6 text-white" />}
                actions={actions}
              />
            );
            
            // Property: Header should always have a nav element
            const nav = container.querySelector('nav');
            expect(nav).toBeTruthy();
            
            // Property: Header should always have a container
            const containerDiv = container.querySelector('.container');
            expect(containerDiv).toBeTruthy();
            
            // Property: Header should always have flex layout
            const flexContainer = container.querySelector('.flex.items-center.justify-between');
            expect(flexContainer).toBeTruthy();
            
            // Property: Header should always have an icon container
            const iconContainer = container.querySelector('div[class*="bg-gradient"]');
            expect(iconContainer).toBeTruthy();
            
            // Property: Header should always have a title
            const h1 = container.querySelector('h1');
            expect(h1).toBeTruthy();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all platform headers should use identical design token classes', () => {
      const platforms = [
        { name: 'UMMC Admin', icon: Shield },
        { name: 'Hospital', icon: FileText },
        { name: 'Research', icon: BarChart3 },
        { name: 'Super Admin', icon: Building2 },
      ];

      const headerClasses = platforms.map(platform => {
        const Icon = platform.icon;
        const { container } = render(
          <Header
            title={platform.name}
            subtitle="test@example.com"
            icon={<Icon className="w-6 h-6 text-white" />}
          />
        );
        
        const nav = container.querySelector('nav');
        return nav!.className;
      });

      // Property: All headers should have identical class lists
      const firstHeaderClasses = headerClasses[0];
      headerClasses.forEach((classes, index) => {
        // Extract the core structural classes (ignoring animation classes)
        const coreClasses = classes.split(' ').filter(c => 
          !c.startsWith('motion-') && 
          !c.includes('animate')
        ).sort().join(' ');
        
        const firstCoreClasses = firstHeaderClasses.split(' ').filter(c => 
          !c.startsWith('motion-') && 
          !c.includes('animate')
        ).sort().join(' ');
        
        expect(coreClasses).toBe(firstCoreClasses);
      });
    });

    test('header spacing should use design tokens consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 50 }),
          (title) => {
            const { container } = render(
              <Header
                title={title}
                icon={<Shield className="w-6 h-6 text-white" />}
              />
            );
            
            const nav = container.querySelector('nav');
            const navClasses = nav!.className;
            
            // Property: Should use design token spacing values
            const spacingClasses = navClasses.split(' ').filter(c => 
              c.startsWith('p-') || 
              c.startsWith('px-') || 
              c.startsWith('py-') || 
              c.startsWith('m-') || 
              c.startsWith('mx-') || 
              c.startsWith('my-')
            );
            
            // Property: All spacing should be from design tokens
            spacingClasses.forEach(spacingClass => {
              const isValidSpacing = 
                spacingClass.match(/^(p|px|py|m|mx|my)-\d+$/) !== null;
              expect(isValidSpacing).toBe(true);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
