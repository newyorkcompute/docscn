---
name: emil-design-eng
description: Design-engineering polish checklist inspired by Emil Kowalski's writing on UI craft, animation, interaction feel, and invisible details. Use when reviewing or refining interface motion, component states, hover/press behavior, and perceived performance.
license: See LICENSE.txt
---

# Emil Design Engineering

This is a docscn-local adaptation inspired by Emil Kowalski's design-engineering philosophy. Use it as a practical polish pass after the main UI structure is already sound.

Source reference: https://github.com/emilkowalski/skill/blob/main/skills/emil-design-eng/SKILL.md

## Core Stance

Great interfaces feel correct before users can explain why. Most of that feeling comes from small details: fast feedback, restrained animation, good defaults, accessible motion, and interactions that behave exactly as expected.

When applying this skill, do not add motion for decoration alone. Tighten the parts users touch often, remove sluggishness, and make polish compound invisibly.

## Required Review Format

When reviewing UI, use this table format:

| Before | After | Why |
| --- | --- | --- |
| `transition: all 300ms` | `transition: transform 160ms var(--ease-out)` | Specify properties and keep feedback crisp |
| Hover transform on touch devices | Gate hover motion with `@media (hover: hover) and (pointer: fine)` | Avoid false hover states after taps |
| Entry from `scale(0)` | Start near `scale(0.95)` plus opacity | Elements should not appear from nothing |

## Animation Decision Framework

Before adding animation, answer:

1. **How often will users see it?**
   - 100+ times/day: no animation.
   - Tens of times/day: reduce or remove.
   - Occasional: standard animation is fine.
   - Rare/first-run: can add delight.

2. **What purpose does it serve?**
   - Feedback: button press, copy confirmation, selected state.
   - Spatial consistency: drawer/toast/popover enters from its origin.
   - Explanation: marketing or onboarding demonstration.
   - Jarring-change prevention: opacity/transform transition for appearing content.

3. **What properties animate?**
   - Prefer `transform` and `opacity`.
   - Avoid animating layout properties like `height`, `width`, `padding`, and `margin` unless the component truly needs it.
   - Specify transition properties explicitly; avoid `transition: all`.

4. **How long should it last?**
   - Button press: 100-160ms.
   - Tooltips / small popovers: 125-200ms.
   - Dropdowns / selects: 150-250ms.
   - Modals / drawers: 200-500ms.
   - Most UI animation should stay under 300ms.

## Easing Defaults

Use stronger curves than browser defaults:

```css
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}
```

- Use `var(--ease-out)` for entering elements, hover lift, button feedback, and most UI responses.
- Use `var(--ease-in-out)` for visible movement between two positions.
- Avoid `ease-in` for UI feedback; it starts slowly and feels unresponsive.

## Component Polish Checklist

- Buttons and pressable cards should have subtle `:active` feedback (`scale(0.97)` to `scale(0.98)`).
- Hover transforms must be behind `@media (hover: hover) and (pointer: fine)`.
- Popovers should scale from their trigger when possible; centered modals stay centered.
- Use CSS transitions for interruptible UI states; reserve keyframes for predetermined page-entry or decorative motion.
- Respect `prefers-reduced-motion`: remove movement, keep helpful opacity/color transitions.
- For copy/export actions, state changes should feel immediate and unambiguous.

## docscn Application Notes

Use this skill for:

- Landing page CTA and hover/press feedback.
- Artifact workspace toolbar and review drawer motion.
- Button, card, badge, and command-copy micro-interactions.
- Reducing mobile/touch hover artifacts.

Pair with:

- [frontend-design](../frontend-design/SKILL.md) for visual direction.
- `/skills.md` for artifact publishing and iframe theme rules.
- [web-artifacts-builder](../web-artifacts-builder/SKILL.md) for complex bundled React artifacts.

When polishing docscn, prefer small, exact changes over broad redesigns. The goal is software that feels faster and more intentional without making users notice the animation.
