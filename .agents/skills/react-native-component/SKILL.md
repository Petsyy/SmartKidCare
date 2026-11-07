---
name: react-native-component
description: Create reusable React Native components for SmartKidCare.
---

# Goal

Create reusable, accessible, and well-typed React Native components that integrate cleanly into the SmartKidCare design system.

---

# Architecture

## Shared Components

Reusable components live in `mobile/src/components/ui/` and are re-exported via `mobile/src/components/ui/index.ts`.

Existing shared components:

- `ScreenShell` — safe area wrapper with keyboard avoiding and status bar
- `ScreenHeader` — consistent screen header with back navigation
- `GradientButton` — primary action button with gradient, loading, and disabled states
- `PasswordInput` — secure text input with visibility toggle
- `SearchBar` — search input with consistent styling
- `ChildCard` — child profile card
- `MiniStatCard` — compact stat display
- `MonthlyRecordViewer` — paginated monthly record viewer
- `ErrorBoundary` — error boundary wrapper
- `AuthLayout` — authentication screen layout
- `ParentGate` — role-based parent gate
- `DashboardOverview` — dashboard summary layout
- `UserGuide` — onboarding/help overlay

## Feature Components

Feature-specific components live within the feature directory:

```
mobile/src/features/<feature>/
  screens/        → full screen components
  hooks/          → feature-specific hooks
  components/     → feature-specific UI (if needed)
```

---

# Component Pattern

Follow the established SmartKidCare component pattern:

```typescript
import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";

interface MyComponentProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MyComponent({
  title,
  onPress,
  loading = false,
  disabled = false,
  className = "",
}: MyComponentProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`rounded-xl p-4 ${className}`}
      style={({ pressed }) => [
        { opacity: isDisabled ? 0.75 : pressed ? 0.88 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text className="text-white text-center font-bold">{title}</Text>
      )}
    </Pressable>
  );
}
```

---

# Rules

## Always

- Use **TypeScript** with explicit `interface` for all props.
- Use **functional components** — never class components.
- Use **NativeWind** `className` props for styling (the project uses NativeWind, not StyleSheet).
- Accept an optional `className` prop for external customisation.
- Provide sensible defaults for optional props.
- Handle all visual states: loading, empty, error, disabled, success.
- Include accessibility props: `accessibilityRole`, `accessibilityLabel`, `accessibilityState`.

## Never

- Inline business logic — extract to hooks.
- Inline API calls — those belong in `mobile/src/api/`.
- Create a component that duplicates an existing shared component.
- Use `StyleSheet.create()` — use NativeWind `className` instead.
- Use inline styles except for truly dynamic values (opacity, transforms).

---

# Styling

The project uses **NativeWind** (Tailwind CSS for React Native). Use `className` props on all React Native components.

```tsx
<View className="flex-1 bg-gray-50 p-4">
  <Text className="text-lg font-bold text-gray-900">Title</Text>
  <Text className="text-sm text-gray-500 mt-1">Subtitle</Text>
</View>
```

Common patterns:

- Backgrounds: `bg-gray-50`, `bg-white`
- Text colours: `text-gray-900`, `text-gray-500`, `text-white`
- Spacing: `p-4`, `px-6`, `mt-2`, `gap-3`
- Borders: `rounded-xl`, `border border-gray-200`
- Flex: `flex-1`, `flex-row`, `items-center`, `justify-center`
- Gradients: use `expo-linear-gradient` `LinearGradient` component (see `GradientButton`)

Brand colours: teal (`#14b8a6`) and emerald (`#059669`) for primary gradients.

---

# State Handling

Every interactive component must handle these states:

| State    | Pattern                                           |
| -------- | ------------------------------------------------- |
| Loading  | `ActivityIndicator` or skeleton placeholder       |
| Disabled | Reduced opacity (`0.75`), `disabled={true}`       |
| Error    | Inline error message or `ErrorBoundary`           |
| Empty    | Friendly message (e.g. "No children found")       |
| Success  | Visual feedback (checkmark, colour change, alert) |

---

# Accessibility

- Pressable elements: `accessibilityRole="button"`, `accessibilityLabel`, `accessibilityState`
- Text inputs: `accessibilityLabel` or `placeholder`
- Images: `accessibilityLabel` describing the image
- Touch targets: minimum 44x44 points (use `py-4 px-6` or larger)

---

# Performance

- Use `React.memo` only when profiling shows unnecessary re-renders.
- Use `useMemo` for expensive computations (e.g. filtering/sorting lists).
- Use `useCallback` for callbacks passed to memoised children or FlatList.
- Use `FlatList` for lists longer than ~20 items — never `.map()` inside `ScrollView`.

---

# When to Create Shared vs Feature Components

| Criteria                                        | Location                        |
| ----------------------------------------------- | ------------------------------- |
| Used in 2+ features                             | `mobile/src/components/ui/`     |
| Feature-specific, not reused                    | `mobile/src/features/<feature>/components/` |
| Wraps a third-party library                     | `mobile/src/components/ui/`     |
| Pure layout/structure (screen shell, header)    | `mobile/src/components/ui/`     |

When adding to shared components, update `mobile/src/components/ui/index.ts`.

---

# Checklist

- [ ] TypeScript interface for all props
- [ ] Functional component with named export
- [ ] NativeWind className styling (not StyleSheet)
- [ ] Optional className prop for external customisation
- [ ] All states handled: loading, disabled, error, empty, success
- [ ] Accessibility props included
- [ ] No inline business logic or API calls
- [ ] No duplication of existing shared components
- [ ] Explain why the component exists and reuse opportunities