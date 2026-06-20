---
name: writing
description: Remove AI writing patterns from prose for Garage Go 2.0 documentation. Use when drafting, editing, or reviewing text to eliminate predictable AI tells and write in a human, professional tone.
metadata:
  trigger: Writing documentation, editing drafts, reviewing content for AI patterns, creating README files
  author: Adapted from stop-slop for Garage Go
---

# Writing Guidelines for Garage Go 2.0

Eliminate predictable AI writing patterns from documentation and prose.

## Core Rules

1. **Cut filler phrases.** Remove throat-clearing openers, emphasis crutches, and all adverbs.
2. **Break formulaic structures.** Avoid binary contrasts, negative listings, dramatic fragmentation, rhetorical setups, false agency.
3. **Use active voice.** Every sentence needs a human subject doing something. No passive constructions. No inanimate objects performing human actions.
4. **Be specific.** No vague declaratives ("The reasons are structural"). Name the specific thing. No lazy extremes ("every," "always," "never") doing vague work.
5. **Put the reader in the room.** No narrator-from-a-distance voice. "You" beats "People." Specifics beat abstractions.
6. **Vary rhythm.** Mix sentence lengths. Two items beat three. End paragraphs differently. No em dashes.
7. **Trust readers.** State facts directly. Skip softening, justification, hand-holding.
8. **Cut quotables.** If it sounds like a pull-quote, rewrite it.

## Quick Checks

Before delivering prose:

- Any adverbs? Kill them.
- Any passive voice? Find the actor, make them the subject.
- Inanimate thing doing a human verb ("the decision emerges")? Name the person.
- Sentence starts with a Wh- word? Restructure it.
- Any "here's what/this/that" throat-clearing? Cut to the point.
- Any "not X, it's Y" contrasts? State Y directly.
- Three consecutive sentences match length? Break one.
- Paragraph ends with punchy one-liner? Vary it.
- Em-dash anywhere? Remove it.
- Vague declarative ("The implications are significant")? Name the specific implication.
- Narrator-from-a-distance ("Nobody designed this")? Put the reader in the scene.
- Meta-joiners ("The rest of this essay...")? Delete. Let the essay move.

## Scoring

Rate 1-10 on each dimension:

| Dimension | Question |
|-----------|----------|
| Directness | Statements or announcements? |
| Rhythm | Varied or metronomic? |
| Trust | Respects reader intelligence? |
| Authenticity | Sounds human? |
| Density | Anything cuttable? |

Below 35/50: revise.

## Examples

### Before (AI-like)
```
In today's rapidly evolving automotive industry, the need for efficient garage management systems has become increasingly important. This comprehensive guide will walk you through the entire process of setting up Garage Go 2.0, ensuring that you have all the necessary tools and knowledge to succeed.
```

### After (Human)
```
Garage Go 2.0 manages automotive service operations. This guide covers setup and configuration.
```

### Before (AI-like)
```
The system features a robust authentication mechanism that ensures only authorized users can access sensitive data. Additionally, the multi-tenant architecture provides complete data isolation between different garages.
```

### After (Human)
```
Authentication restricts access to authorized users. Multi-tenancy isolates data between garages.
```

### Before (AI-like)
```
It is worth noting that the accounting module automatically generates journal entries for all financial transactions, which significantly reduces the risk of human error and ensures compliance with accounting standards.
```

### After (Human)
```
The accounting module generates journal entries automatically for all transactions. This reduces human error and ensures compliance.
```

## Garage Go Specific Guidelines

### Technical Documentation

- Use imperative mood for instructions: "Run this command" not "You should run this command"
- Be concise: "Install dependencies" not "In order to proceed, you need to install the dependencies"
- Avoid "In order to": Delete it. Start with the action.
- Avoid "It is important to note that": Delete it. State the fact directly.
- Avoid "The purpose of this is": Delete it. Explain what it does.

### API Documentation

- Describe what the endpoint does, not why it exists
- Use present tense: "Returns booking data" not "Will return booking data"
- Avoid "This endpoint is designed to": Delete it. State what it does.
- Avoid "Please note that": Delete it. State the constraint directly.

### README Files

- Start with what the project does, not why it matters
- Avoid "This project aims to": Delete it. State what it does.
- Avoid "The goal of this project is": Delete it. State the purpose directly.
- Avoid "We are excited to announce": Delete it. Announce it.

### Commit Messages

- Use imperative mood: "Add booking API" not "Added booking API"
- Be specific: "Fix booking status validation" not "Fix bugs"
- Avoid "This commit": Delete it. State what changed.
- Avoid "In this commit": Delete it. State the change.

## Common AI Patterns to Avoid

### Throat-Clearing Openers
- "In today's world"
- "In the modern era"
- "In this rapidly evolving landscape"
- "It is worth noting that"
- "It is important to understand that"
- "It should be mentioned that"

### Emphasis Crutches
- "very"
- "extremely"
- "incredibly"
- "highly"
- "significantly"
- "substantially"

### Binary Contrasts
- "not just X, but also Y"
- "not only X, but Y as well"
- "not merely X, but truly Y"
- "it's not X, it's Y"

### Negative Listings
- "not limited to"
- "not restricted to"
- "not confined to"
- "not exclusive to"

### Dramatic Fragmentation
- "Powerful. Fast. Reliable."
- "Simple. Secure. Scalable."

### Rhetorical Setups
- "You might be wondering"
- "You may ask yourself"
- "The question is"

### False Agency
- "The system decides"
- "The algorithm determines"
- "The process emerges"
- "The solution reveals"

## Good Examples for Garage Go

### README Header
```
# Garage Go 2.0

Automotive service management system with multi-tenancy, automatic accounting, and real-time notifications.
```

### API Endpoint Description
```
POST /api/bookings

Creates a new booking. Requires customer ID, vehicle ID, and service list. Returns booking ID and public token.
```

### Feature Description
```
Automatic Accounting

The system generates journal entries for all financial transactions. Booking payments debit cash and credit revenue. Part purchases debit inventory and credit suppliers.
```

### Setup Instructions
```
Install dependencies:
npm install

Configure environment:
cp .env.example .env

Start the server:
npm run dev
```

## Checklist

Before publishing documentation:

- [ ] No adverbs
- [ ] No passive voice
- [ ] No throat-clearing openers
- [ ] No "not X, but Y" contrasts
- [ ] No rhetorical questions
- [ ] No dramatic fragmentation
- [ ] No false agency
- [ ] Specific examples instead of vague statements
- [ ] Direct statements instead of announcements
- [ ] Varied sentence lengths
- [ ] No em dashes
- [ ] No "here's what/this/that" phrases
- [ ] No "it is important to note that"
- [ ] No "in order to"
- [ ] No "the purpose of this is"

## License

MIT (adapted from stop-slop)
