# Design Token Documentation

This document provides comprehensive documentation for the design token system used in the toe application. The token system is organized into semantic layers that promote consistency and maintainability.

## Token Organization

### 1. Color System

#### Palette Colors

Raw color values that serve as the foundation for all semantic colors.

```css
/* Example palette colors */
--palette-teal-500: #10b981;
--palette-rose-500: #f43f5e;
--palette-gray-900: #212529;
```

#### Semantic Colors

Intent-based colors that communicate meaning and purpose.

```css
/* Primary actions and accents */
--color-accent: var(--palette-teal-500);
--color-accent-hover: var(--palette-teal-600);
--color-accent-subtle: rgba(16, 185, 129, 0.1);

/* Destructive actions */
--color-danger: var(--palette-rose-500);
--color-danger-hover: var(--palette-rose-600);
--color-danger-subtle: rgba(244, 63, 94, 0.1);
```

**Usage Examples:**

```css
/* ✅ Good - Use semantic colors */
.primary-button {
   background: var(--color-accent);
   color: var(--color-text-inverse);
}

.primary-button:hover {
   background: var(--color-accent-hover);
}

/* ❌ Avoid - Don't use palette colors directly */
.primary-button {
   background: var(--palette-teal-500);
}
```

#### Text Colors

Hierarchical text color system for content readability.

```css
--color-text-primary: var(--palette-gray-900); /* Main content */
--color-text-secondary: var(--palette-gray-600); /* Supporting text */
--color-text-tertiary: var(--palette-gray-500); /* Subtle text */
--color-text-inverse: var(--palette-white); /* Text on dark backgrounds */
--color-text-disabled: var(--palette-gray-400); /* Disabled state */
```

#### Background Colors

Layered background system for visual hierarchy.

```css
--color-bg-canvas: var(--palette-white); /* Page background */
--color-bg-surface: var(--palette-white); /* Card/component background */
--color-bg-subtle: var(--palette-gray-50); /* Subtle background */
--color-bg-muted: var(--palette-gray-100); /* Muted background */
--color-bg-overlay: rgba(0, 0, 0, 0.8); /* Modal overlay */
--color-bg-glass: rgba(255, 255, 255, 0.1); /* Glassmorphism effect */
```

### 2. Spacing System

Consistent 4px-based spacing scale for layout and component spacing.

```css
--space-0: 0; /* 0px */
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-12: 3rem; /* 48px */
```

**Usage Examples:**

```css
/* Component padding */
.card {
   padding: var(--space-6);
}

/* Element spacing */
.button-group {
   gap: var(--space-3);
}

/* Margin utilities */
.section {
   margin-bottom: var(--space-8);
}
```

### 3. Border Radius System

Consistent rounding scale for visual cohesion.

```css
--radius-none: 0;
--radius-sm: 0.25rem; /* 4px - Small elements */
--radius-md: 0.375rem; /* 6px - Default radius */
--radius-lg: 0.5rem; /* 8px - Buttons, cards */
--radius-xl: 0.75rem; /* 12px - Large components */
--radius-2xl: 1rem; /* 16px - Modals, overlays */
--radius-pill: 999px; /* Pill-shaped elements */
```

### 4. Shadow System

Layered elevation system for depth and hierarchy.

```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1); /* Subtle elevation */
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07); /* Default elevation */
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1); /* Prominent elevation */
--shadow-elevated: 0 25px 50px -12px rgba(0, 0, 0, 0.25); /* Modal/overlay */
--shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.12); /* Glassmorphism */
```

### 5. Motion System

Animation and transition tokens for consistent motion design.

```css
/* Duration tokens */
--duration-fast: 120ms; /* Quick interactions */
--duration-medium: 200ms; /* Standard transitions */
--duration-slow: 300ms; /* Deliberate animations */

/* Easing tokens */
--easing-standard: cubic-bezier(0.4, 0, 0.2, 1); /* Material Design standard */
--easing-decelerate: cubic-bezier(0, 0, 0.2, 1); /* Entering elements */
--easing-accelerate: cubic-bezier(0.4, 0, 1, 1); /* Exiting elements */

/* Composite transitions */
--transition-fast: all var(--duration-fast) var(--easing-standard);
--transition-colors:
   background-color var(--duration-medium) var(--easing-standard),
   border-color var(--duration-medium) var(--easing-standard);
```

### 6. Z-Index System

Layered stacking system for proper element layering.

```css
--z-base: 0; /* Base layer */
--z-canvas: 1; /* Game canvas */
--z-dropdown: 10; /* Dropdown menus */
--z-overlay: 30; /* General overlays */
--z-status: 100; /* Status bar */
--z-modal: 1000; /* Modal dialogs */
--z-toast: 1100; /* Toast notifications */
```

## Component-Specific Tokens

### Status Bar Component

### Button Component

```css
--button-padding: var(--space-3) var(--space-4);
--button-radius: var(--radius-lg);
--button-transition: var(--transition-colors), var(--transition-transform);
--button-focus-ring: 2px solid var(--color-accent);
```

## Migration Guide

### From Legacy Variables

```css
/* ❌ Legacy (deprecated) */
.old-style {
   background: var(--bg-primary);
   color: var(--text-primary);
   padding: var(--spacing-md);
   border-radius: var(--border-radius);
   box-shadow: var(--shadow);
}

/* ✅ Modern tokens */
.new-style {
   background: var(--color-bg-surface);
   color: var(--color-text-primary);
   padding: var(--space-4);
   border-radius: var(--radius-lg);
   box-shadow: var(--shadow-md);
}
```

### Component Token Usage

```css
/* ❌ Avoid hardcoded values */
.status-bar {
   background: rgba(255, 255, 255, 0.9);
   border-radius: 25px;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

/* ✅ Use component tokens */
.status-bar {
   background: var(--statusbar-bg);
   border-radius: var(--statusbar-radius);
   box-shadow: var(--statusbar-shadow);
}
```

## Best Practices

### 1. Token Selection Hierarchy

1. **Component tokens** - Use when available for specific components
2. **Semantic tokens** - Use for general styling (colors, spacing, etc.)
3. **Palette tokens** - Only use for creating new semantic tokens

### 2. Naming Conventions

- Use semantic names that describe purpose, not appearance
- Follow the pattern: `--category-property-variant`
- Examples: `--color-text-primary`, `--space-4`, `--radius-lg`

### 3. Creating New Tokens

When adding new tokens, follow this process:

1. Check if existing tokens can be used
2. Add to the appropriate category in `tokens.css`
3. Update this documentation
4. Consider if it should be a component-specific token

### 4. Dark Mode Preparation

All color tokens are designed to support future dark mode implementation:

```css
/* Light mode (default) */
:root {
   --color-bg-canvas: var(--palette-white);
   --color-text-primary: var(--palette-gray-900);
}

/* Dark mode (future) */
@media (prefers-color-scheme: dark) {
   :root {
      --color-bg-canvas: var(--palette-gray-900);
      --color-text-primary: var(--palette-white);
   }
}
```

## Token Reference Quick Guide

| Category | Prefix                                      | Example                                    |
| -------- | ------------------------------------------- | ------------------------------------------ |
| Colors   | `--color-`                                  | `--color-accent`, `--color-text-primary`   |
| Spacing  | `--space-`                                  | `--space-4`, `--space-8`                   |
| Radius   | `--radius-`                                 | `--radius-md`, `--radius-pill`             |
| Shadows  | `--shadow-`                                 | `--shadow-md`, `--shadow-elevated`         |
| Motion   | `--duration-`, `--easing-`, `--transition-` | `--duration-medium`, `--transition-colors` |
| Z-Index  | `--z-`                                      | `--z-modal`, `--z-overlay`                 |

This token system provides a solid foundation for consistent, maintainable styling across the application while supporting future enhancements like dark mode and design system evolution.
