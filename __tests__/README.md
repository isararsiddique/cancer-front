# Design System Property-Based Tests

This directory contains property-based tests for the Registry Platform design system.

## Setup

Before running tests, install the required dependencies:

```bash
npm install
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Files

### design-tokens.test.ts
Tests for **Property 4: UI Gradient Consistency**
- Validates that all gradient definitions follow consistent format
- Ensures gradients are identical across all platforms
- Verifies all required gradient types are defined
- Checks that gradient colors use valid Tailwind classes

**Validates Requirements:** 2.1, 2.4

### component-styling.test.tsx
Tests for **Property 5: Component Styling Uniformity**
- Validates Button component uses consistent design tokens
- Ensures Card component applies consistent spacing
- Verifies StatCard uses consistent gradient configurations
- Checks that all components use design tokens (not hardcoded values)
- Validates border radius consistency
- Ensures shadow definitions are consistent
- Verifies typography classes are uniform

**Validates Requirements:** 2.2

## Property-Based Testing

These tests use [fast-check](https://github.com/dubzzz/fast-check) for property-based testing. Each test runs 100 iterations with randomly generated inputs to ensure properties hold across all valid inputs.

## Test Configuration

- **Test Framework:** Jest
- **PBT Library:** fast-check
- **React Testing:** @testing-library/react
- **Iterations per test:** 100 (configurable via `numRuns`)
