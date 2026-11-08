# English Learning Feasibility Lab

Run `node probes/local-lab.mjs` from the project root and open http://127.0.0.1:4178/ in Chrome.

1. Connect your ChatGPT plan through the official consent flow. Tokens remain in server memory; restarting requires reconnection.
2. Keep app credit use disabled in ChatGPT settings. The lab cannot read or change that account preference. The checkbox records your confirmation, not independent verification. No API-key or provider fallback exists.
3. In the conversation panel, confirm the setting, select a returned model and voice, then press Speak or type and Send.
4. Press Stop after speaking, review the transcript, then press Send. Pauses do not send a message. Browser recognition restarts after natural termination while recording remains active. Only text is sent by the lab; browser recognition may process microphone audio remotely. Speech messages and their saved history are tagged so the tutor does not treat transcription capitalization, punctuation or spelling as learner errors.
5. Use Stop to interrupt recording, generation or playback. Repeat reply replays without another model request.
6. Reload to recover completed exchanges for your verified account. An interrupted exchange is not committed. If cancellation races with completion, reload to inspect the authoritative saved history.

Timing distinguishes first text, full model reply and (when the browser emits a speech-end event) speech-end to reply-audio start. These are single-session observations, not service guarantees.

Conversations are local JSON files under output/feasibility, keyed by a SHA-256 digest of the verified issuer and subject. A random HttpOnly SameSite cookie gates conversation/model endpoints. This is a single-account technical lab, not a production multi-user service. No raw audio or OAuth credentials are saved. Local conversation files are not encrypted.

Tests:

```
node --test probes/tutor-service.test.mjs probes/auth-flow.test.mjs
```

Service tests use synthetic streams, not live model calls. The earlier tutor-results.json used existing Codex subscription authentication, not this freshly authorized SIWC connection. A real SIWC conversation remains a separate acceptance check.
