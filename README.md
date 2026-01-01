# AI Content Moderation for Firestore

Automatically evaluates user-generated text in Firestore documents and applies configurable moderation actions.

## Overview

This Firebase Extension monitors a Firestore collection and evaluates new documents using a configurable AI provider. Based on the evaluation results, it can flag, hide, or delete content that exceeds the sensitivity threshold.

## Features

- Monitors a configurable Firestore collection path
- Supports three AI providers: OpenAI Moderation API, Google Gemini, Local rules
- Configurable moderation actions: flag, hide, delete
- Adjustable sensitivity threshold
- Optional backfill of existing documents
- Optional Eventarc event publishing
- Versioned idempotency guard to prevent re-processing

## Installation

Install via Firebase CLI:

```bash
firebase ext:install deutale-learngerman/firestore-ai-content-moderation --project=YOUR_PROJECT_ID
```

Or install from local source:

```bash
firebase ext:install . --project=YOUR_PROJECT_ID
```

## Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| COLLECTION_PATH | Firestore collection to monitor | comments |
| TEXT_FIELD | Document field containing text | text |
| MODERATION_FIELD | Field for moderation output | moderation |
| AI_PROVIDER | AI provider selection | openai |
| MODERATION_ACTION | Action for flagged content | flag |
| SENSITIVITY | Threshold for flagging (0.0-1.0) | 0.5 |

## Development

Run locally with the Firebase Emulator:

```bash
cd functions/integration-tests
firebase emulators:start --project=demo-test
```

## License

Apache-2.0

---

## About DeuTale

**DeuTale** is a free German offline reading app—a modern German language learning app designed to help A1–C2 learners improve reading, vocabulary, and comprehension through interactive stories. Instead of memorizing isolated words, you learn German naturally by reading engaging texts where every sentence builds your understanding. With instant translation, clear explanations, and vocabulary tools, DeuTale makes it easy to learn German at your own pace and grow your German vocabulary through meaningful reading practice.

### What Makes This App Unique

DeuTale uses a story-based learning method that helps you understand German the way native speakers do—through meaningful context. Instead of flashcards or random exercises, you learn from graded readers, short stories, and adapted German novels written especially for beginners. Each text is simplified to match A1–C2 levels, allowing you to follow real narratives while absorbing vocabulary, grammar, and sentence structure naturally. This immersive approach strengthens comprehension, builds intuitive language patterns, and makes learning German more memorable and enjoyable.

Story-based, contextual learning has proven cognitive benefits: when words appear inside stories, your brain connects meaning, emotion, and usage, helping you remember faster and understand deeper.

### Key Features

- **Instant Translation (Tap-to-Translate)**: Tap any German word or sentence to see its meaning instantly, helping you read smoothly without breaking focus.
- **Pronunciation Audio**: Hear native-like pronunciation for every word, improving your speaking and listening skills as you read.
- **Dual-Language Reading Mode**: Switch between German–English or German–Arabic to understand stories clearly and reinforce meaning through parallel texts.
- **Smart Vocabulary Builder**: Save unfamiliar words, organize them into lists, and review them anytime. Your personal German vocabulary grows with every story you read.
- **Flashcards & Spaced Repetition**: Strengthen long-term memory using scientifically proven spaced-repetition flashcards that help you retain German vocabulary more effectively.
- **Reading Comprehension Tools**: Highlighting, definitions, examples, and sentence-level explanations help you understand German grammar and phrasing directly in context.

### Benefits for Learners

DeuTale is designed to help learners progress faster by giving them the tools they need to understand real German with confidence. The story-based approach allows you to learn German fast because you see new words repeatedly in meaningful contexts, which accelerates vocabulary acquisition and makes grammar easier to grasp.

Whether your goal is to improve your German vocabulary, practice reading every day, or prepare for A1, A2, or B1 language exams, DeuTale provides a clear learning path that supports steady growth. Beginners especially benefit from graded stories, instant translation, and simple explanations that make reading accessible from day one.

### Who This App Is For

- **German beginners** benefit from graded stories and instant translation that make reading accessible from the very first lesson
- **Self-learners** who prefer studying at their own pace will appreciate the clear explanations, vocabulary tools, and flexible learning flow
- **Students preparing for A1, A2, or B1 exams** can use the app to strengthen reading comprehension and expand vocabulary through consistent practice
- **Immigrants and expats** learning German for daily life will find practical language examples that reflect real communication
- **Language enthusiasts** who enjoy reading stories

### Learn More

- Website: [https://deutale.com](https://deutale.com)
- Google Play: [DeuTale - Learn German](https://play.google.com/store/apps/details?id=com.germanstory.app)
- Publisher: DeuTale - Learn German
