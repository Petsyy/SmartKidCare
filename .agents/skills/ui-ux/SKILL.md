---
name: ui-ux
description: Maintain a consistent user experience across SmartKidCare.
---

# Goal

Ensure every screen in SmartKidCare provides a polished, accessible, and consistent user experience — across all roles (admin, teacher, parent) and all states.

---

# Design System

## Styling

SmartKidCare uses **NativeWind** (Tailwind CSS for React Native). All styling is done via `className` props — never `StyleSheet.create()`.

## Brand Colours

| Usage | Colour | Tailwind / Hex |
| --- | --- | --- |
| Primary gradient start | Teal | `#14b8a6` |
| Primary gradient end | Emerald | `#059669` |
| Background | Light gray | `bg-gray-50` |
| Card background | White | `bg-white` |
| Primary text | Dark gray | `text-gray-900` |
| Secondary text | Medium gray | `text-gray-500` |
| Error / destructive | Red | `text-red-500` |
| Success | Green | `text-green-500` |
| Disabled gradient | Gray | `#d1d5db` → `#9ca3af` |

## Layout Components

Use the established shared components:

- **`ScreenShell`** — wraps every screen with SafeAreaView, StatusBar, and optional KeyboardAvoidingView
- **`ScreenHeader`** — consistent back-navigation header with title
- **`GradientButton`** — primary call-to-action with loading/disabled states
- **`SearchBar`** — consistent search input

---

# Screen State Requirements

Every screen **must** handle all five states:

### Loading

- Show a spinner (`ActivityIndicator`) or skeleton layout while data loads.
- Never show a blank screen.
- Use `isLoading` from TanStack Query's `useQuery`.

### Empty

- Show a friendly, contextual message when there is no data.
- Example: "No attendance records for today" — not just "No data".
- Include an icon or illustration when appropriate.

### Error

- Show an inline error message with a retry option.
- Never show raw error objects or stack traces.
- Use `ErrorBoundary` for unexpected crashes.
- Use `error` and `refetch` from `useQuery` for API errors.

### Success

- Provide clear feedback after user actions (form submission, record creation).
- Use alerts (`Alert.alert()`), toast messages, or visual state changes.
- Invalidate relevant TanStack Query caches on mutation success.

### Offline (where applicable)

- Show a clear "No internet connection" indicator.
- Disable actions that require the network.
- Retain locally available data when possible.

---

# Form Standards

### Validation

- Use inline validation — show errors below the relevant field, not in alerts.
- Validate on submit, not on every keystroke (unless the field has real-time constraints).
- Use the validation utilities in `mobile/src/validations/` for shared rules.

### Error Messages

- Write **specific, helpful messages**: "Password must be at least 8 characters" — not "Invalid input".
- Place error messages directly below the input field.
- Use `text-red-500 text-sm mt-1` styling for consistency.

### Keyboard Handling

- Use `ScreenShell` with `withKeyboardAvoiding={true}` (default) for forms.
- Set `returnKeyType` appropriately: "next" for intermediate fields, "done" for the last field.
- Auto-focus the first input when the screen loads (where appropriate).

---

# Button Standards

| Type | Component | Usage |
| --- | --- | --- |
| Primary action | `GradientButton` | Submit, confirm, main CTA |
| Secondary action | Custom `Pressable` | Cancel, dismiss, alternative actions |
| Destructive action | Red-themed button | Delete, remove |

All buttons must:

- Show a loading spinner when `isPending` from `useMutation`
- Be disabled during loading and when the form is invalid
- Have a minimum touch target of 44x44 points (`py-4` minimum)
- Include `accessibilityRole="button"` and `accessibilityLabel`

---

# Navigation

- Navigation should be **predictable** — users always know where they are and how to go back.
- Use `ScreenHeader` with a back button for non-root screens.
- Minimise the number of taps to reach key actions.
- Use `expo-router` for navigation — never manual stack management.

---

# Typography

- Headings: `text-xl font-bold text-gray-900` or `text-2xl font-bold`
- Body text: `text-base text-gray-700`
- Secondary text: `text-sm text-gray-500`
- Labels: `text-sm font-medium text-gray-700`
- Error text: `text-sm text-red-500`

---

# Spacing and Layout

- Screen padding: `px-4` or `px-6`
- Card padding: `p-4`
- Section gaps: `gap-4` or `gap-6`
- Vertical spacing between elements: `mt-2`, `mt-4`, `mb-4`
- Card borders: `rounded-xl border border-gray-200` or `rounded-2xl`

---

# Accessibility

- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Colour contrast meets WCAG AA standards
- Text is readable at default device font size
- Touch targets are at least 44x44 points
- Form inputs have associated labels

---

# Consistency Checklist

When building or reviewing any screen:

- [ ] Uses `ScreenShell` as the root wrapper
- [ ] Uses `ScreenHeader` for the header (non-root screens)
- [ ] Handles all 5 states: loading, empty, error, success, offline
- [ ] Primary action uses `GradientButton`
- [ ] Forms show inline validation errors
- [ ] Buttons show loading state during async operations
- [ ] Spacing and typography match the design system
- [ ] Accessibility props included on all interactive elements
- [ ] Navigation is predictable with back button support
- [ ] Data fetching uses TanStack Query with proper query keys