# Devin Skills for Garage Go 2.0

This directory contains custom Devin skills adapted for the Garage Go 2.0 project.

⚠️ **IMPORTANT: NO EMAILS ALLOWED** - See [NO_EMAILS.md](../../NO_EMAILS.md)

## Available Skills

### 1. ui-ux
**Path:** `.devin/skills/ui-ux/SKILL.md`

**Description:** UI/UX design intelligence for Garage Go 2.0 applications. Includes 50+ styles, color palettes, font pairings, UX guidelines, and chart types.

**When to Use:**
- Designing new pages (Dashboard, Admin Panel, Mobile App, Customer Page)
- Creating or refactoring UI components
- Choosing color schemes, typography systems, spacing standards
- Reviewing UI code for user experience, accessibility, or visual consistency
- Implementing navigation structures, animations, or responsive behavior

**Key Features:**
- Accessibility guidelines (CRITICAL priority)
- Touch & interaction rules for mobile
- Performance optimization tips
- Style selection (Modern Dashboard for Garage Go)
- Layout & responsive patterns
- Typography & color scales
- Animation guidelines
- Form & feedback patterns
- Navigation patterns for Flutter Web/Desktop/Mobile
- Chart & data visualization guidelines

**Garage Go Specific:**
- Admin Dashboard layout specifications
- Mechanic App mobile patterns
- Customer Frontend design guidelines
- Color palette (Professional Blue + Success Green + Warning Amber + Error Red)
- Font pairing (Cairo for Arabic, Inter for English)
- Spacing, border radius, and shadow scales

---

### 2. design-system
**Path:** `.devin/skills/design-system/SKILL.md`

**Description:** Design token architecture and component specifications for Garage Go 2.0. Three-layer tokens (primitive→semantic→component), CSS variables, spacing/typography scales, component specs.

**When to Use:**
- Design token creation
- Component state definitions
- CSS variable systems
- Spacing/typography scales
- Flutter theme configuration
- Component specifications

**Key Features:**
- Three-layer token architecture (Primitive → Semantic → Component)
- Primitive tokens (colors, spacing, typography, border radius, shadows)
- Semantic tokens (purpose-based aliases)
- Component tokens (button, card, input, modal, status badge)
- Flutter theme configuration (light and dark themes)
- CSS variables for customer frontend
- Component specifications with state tables
- Token validation guidelines

**Garage Go Specific:**
- Complete Flutter theme implementation
- CSS variables for customer frontend
- Component state specifications
- Token validation commands
- Integration with Tailwind (if needed)

---

### 3. writing
**Path:** `.devin/skills/writing/SKILL.md`

**Description:** Remove AI writing patterns from prose for Garage Go 2.0 documentation. Use when drafting, editing, or reviewing text to eliminate predictable AI tells.

**When to Use:**
- Writing documentation
- Editing drafts
- Reviewing content for AI patterns
- Creating README files
- Writing API documentation
- Writing commit messages

**Key Features:**
- Core rules for human-like writing
- Quick checks before delivering prose
- Scoring system (1-10 on 5 dimensions)
- Before/after examples
- Garage Go specific guidelines for:
  - Technical documentation
  - API documentation
  - README files
  - Commit messages
- Common AI patterns to avoid
- Good examples for Garage Go
- Checklist before publishing

---

## How to Use These Skills

### In Devin Terminal

When working on Garage Go 2.0, Devin will automatically use these skills when relevant. You can also explicitly invoke them:

```bash
# For UI/UX design decisions
/ui-ux

# For design system and tokens
/design-system

# For writing documentation
/writing
```

### In Code Comments

Add skill references in code comments to guide Devin:

```dart
// TODO: Use ui-ux skill to ensure accessibility compliance
// TODO: Use design-system skill for consistent spacing
// TODO: Use writing skill to improve documentation
```

### In Documentation

Reference skills in documentation files:

```markdown
<!-- This component follows the design-system skill -->
<!-- This documentation follows the writing skill -->
```

---

## Skill Integration

### Flutter Development Workflow

1. **Design Phase:** Use `ui-ux` skill to plan layout, colors, and components
2. **Implementation:** Use `design-system` skill for consistent tokens and theme
3. **Documentation:** Use `writing` skill for clear, human-like documentation

### HTML/CSS Development Workflow

1. **Design Phase:** Use `ui-ux` skill for responsive layouts and accessibility
2. **Implementation:** Use `design-system` skill for CSS variables and component tokens
3. **Documentation:** Use `writing` skill for clear instructions

### Backend Development Workflow

1. **API Documentation:** Use `writing` skill for clear endpoint descriptions
2. **README Updates:** Use `writing` skill for project documentation

---

## Skill Priority

When multiple skills are relevant, follow this priority:

1. **ui-ux** - Design decisions affect user experience (highest priority)
2. **design-system** - Implementation consistency (medium priority)
3. **writing** - Documentation quality (lower priority, but important)

---

## Customization

These skills are adapted from open-source skills (ui-ux-pro-max, ckm:design-system, stop-slop) specifically for Garage Go 2.0. You can customize them further:

- Add Garage Go-specific components to `design-system`
- Add Garage Go-specific UX patterns to `ui-ux`
- Add Garage Go-specific writing examples to `writing`

---

## License

These skills are adapted from open-source projects under MIT license:
- ui-ux-pro-max: MIT
- ckm:design-system: MIT
- stop-slop: MIT

---

**Last Updated:** 2026-05-25
**Project:** Garage Go 2.0
