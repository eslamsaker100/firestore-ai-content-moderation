## Testing the Extension

After installation, test the extension:

1. Open the Cloud Firestore dashboard in the Firebase console.
2. Create a document in the `${param:COLLECTION_PATH}` collection with a `${param:TEXT_FIELD}` field.
3. The document will be updated with a `${param:MODERATION_FIELD}` field containing the results.

## Moderation Output

Processed documents contain a moderation object:

```json
{
  "${param:MODERATION_FIELD}": {
    "processed": true,
    "version": "0.0.1",
    "status": "approved",
    "flagged": false,
    "score": 0.0,
    "provider": "openai",
    "reason": "",
    "categories": {},
    "timestamp": "..."
  }
}
```

Status values:
- `approved` - Content passed moderation
- `flagged` - Content exceeded sensitivity threshold
- `skipped` - No text content found
- `error` - Processing failed

## Moderation Actions

The configured action (`${param:MODERATION_ACTION}`) determines behavior:

| Action | Behavior |
|--------|----------|
| flag | Writes moderation data, content remains visible |
| hide | Writes moderation data and sets `hidden: true` |
| delete | Removes flagged documents entirely |

## Eventarc Events

If events are enabled (`${param:ENABLE_EVENTS}`), the extension publishes:

- `firebase.extensions.firestore-ai-content-moderation.v1.moderated`
- `firebase.extensions.firestore-ai-content-moderation.v1.flagged`

## Monitoring

Monitor extension activity in the Firebase console under Extensions. Check Cloud Functions logs for detailed processing information.

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| Documents not processed | Verify collection path matches configuration |
| API errors | Check API key validity and quota |
| Documents skipped | Ensure text field name matches and contains string data |
