## Version 0.1.0

Initial release of the _AI Content Moderation_ extension.

### Features

- Automatic evaluation of new Firestore documents
- Three AI provider options:
  - OpenAI Moderation API
  - Google Gemini
  - Local rules-based evaluation
- Configurable moderation actions: flag, hide, or delete
- Configurable moderation field name
- Adjustable sensitivity threshold
- Optional backfill of existing documents on install
- Optional Eventarc events for moderation results
- Versioned idempotency guard to prevent re-processing