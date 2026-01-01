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
firebase ext:install deutale/firestore-ai-content-moderation --project=YOUR_PROJECT_ID
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
