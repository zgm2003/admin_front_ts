# P07 WCAG 2.2 AA Manual Test Matrix

Automated checks do not replace assistive-technology testing. The boxes below are user-owned and remain unchecked until the listed environment is tested against the final P07 Docker image.

## Test setup

- Browser: current Microsoft Edge or Chrome at 100% and 200% zoom.
- Keyboard: Tab, Shift+Tab, Enter, Space, Escape, arrow keys, Home, and End.
- Windows screen reader: current NVDA with Edge.
- Apple screen reader: VoiceOver on macOS Safari and iOS Safari.
- Android screen reader: TalkBack on current Android Chrome.
- Visual preferences: Windows High Contrast / `prefers-contrast: more` and reduced motion.

## Flow matrix

| Flow | Keyboard only | NVDA / Windows | VoiceOver / macOS+iOS | TalkBack / Android | 200% zoom | High contrast | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Login and policy confirmation | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Layout, skip link, navigation, and tabs | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Data table and search/filter form | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Shared dialogs and destructive confirmation | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Notification list and realtime notification | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| AI chat, streaming response, composer, and image preview | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## Required observations

- Skip link becomes visible on focus, moves focus to the single main landmark, and route changes focus that landmark once.
- Focus order follows the visual order; no keyboard trap exists; Escape closes dismissible dialogs and focus returns to the trigger.
- Every input has a programmatic label; validation and asynchronous errors are announced without being converted into empty states.
- Loading and result counts use the polite channel; blocking errors use the assertive channel.
- AI streaming deltas are not announced individually; the terminal assistant response is announced once.
- All functionality has a keyboard/touch alternative; visible controls meet the WCAG 2.2 24x24 CSS-pixel minimum and primary mobile actions reach 44x44.
- Text remains readable and no two-dimensional page scrolling is required at 200% zoom.
- Focus indicators remain visible in light, dark, and high-contrast modes.
- Reduced-motion mode removes nonessential transition and animation movement.

## Automated evidence

The implementation gate runs the following inside `node:22.23.1-alpine`:

```text
npm test -- --project component tests/component/accessibility
npm run lint
npm run typecheck
```

The component suite includes axe-core checks and must report zero serious or critical violations for the mounted critical-flow fixtures.
