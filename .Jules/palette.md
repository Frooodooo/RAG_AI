## 2024-05-15 - Language Switcher Accessibility
**Learning:** The language switcher buttons in App.tsx (e.g., "LV", "EN") are functional but lack aria-labels, which makes them less accessible for screen readers, as the text is only an abbreviation. Adding explicit aria-labels ensures screen readers announce "Latvian" or "English" rather than just "L V" or "E N".
**Action:** Always add descriptive `aria-label`s to language toggle buttons.

## 2024-05-15 - Abbreviated Icon Button Accessibility
**Learning:** Buttons containing only icons or brief abbreviations (e.g., 'LV', 'EN' for languages) lack sufficient context for screen readers. The visible text must be incorporated into the `aria-label` to comply with WCAG 2.5.3 (Label in Name). For example, adding an aria-label like "Latviešu: lv" ensures it's fully accessible and passes requirements.
**Action:** Always provide an explicit `aria-label` for buttons that only have abbreviations or icons, and strictly include the visible text directly in the aria-label string.
