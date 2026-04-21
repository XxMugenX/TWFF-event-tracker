# TWFF Google Docs Tracker (Prototype)

A Chrome Extension engineered to natively record verifiable events (edits and pastes) within Google Docs, formatted to the TWFF standard.

🎥 **[Watch the Demo on Loom](https://www.loom.com/share/70e658777907491784e8da0f3679a903)**

---

## 🎯 Overview

This extension was built as a proof-of-concept for capturing real-time human and AI interactions inside the notoriously locked-down Google Docs DOM architecture.  

It intercepts user keystrokes and clipboard pastes, formats the data into a strict JSON schema (`TWFF`), and securely logs it to `chrome.storage.local`. A built-in Popup UI provides a real-time, color-coded feed of the captured events.

## 🏗️ Key Architecture Decisions

Building an extension for Google Docs requires specific workarounds due to its reliance on HTML5 `<canvas>` and dynamically generated invisible iframes. Here is how this prototype solves those challenges:

* **The `about:blank` Iframe Bypass:** Google Docs actively swallows DOM events by shuttling them into dynamically created invisible iframes the millisecond a user acts. Instead of relying on invasive, system-level `navigator.clipboard` permissions, this extension uses the `"match_about_blank": true` manifest rule to securely inject the content script into these temporary frames, catching the events natively.
* **Debounced Typing (Batched Edits):** To prevent massive server strain, keystrokes are not logged individually. The extension utilizes a 1.5-second debouncing timer (a "typing buffer"). It waits for the user to pause their thought process before packaging the entire typed string into a single JSON payload.
* **Force Flushing:** The debouncing buffer includes safety triggers (`blur`, `visibilitychange`, `mousedown`, and arrow keys) to force-flush the buffer if the user switches tabs, clicks a new line, or interacts with the browser UI, ensuring no data is lost during context switching.

## 📦 Data Schema (TWFF)

All events are formatted to standard JSON before being saved to the local vault.  

```json
{
    "schema_version": "1.0",
    "event_type": "edit", 
    "timestamp": "2026-04-21T10:45:12.345Z",
    "actor": "human",
    "payload": {
        "content": "This is a batched sentence.",
        "source_url": "[https://docs.google.com/document/d/](https://docs.google.com/document/d/)...",
        "character_count": 27,
        "surrounding_context": "Context unavailable"
    }
}  
