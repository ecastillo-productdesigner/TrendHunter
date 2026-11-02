# Saved custom share menu

Saved on November 2, 2026, before Share switched to the device's system sharing menu.

- `share.js` is the complete previous sharing implementation.
- `share-menu.css` contains the previous popup and fallback-dialog styles. It uses the app's existing DS tokens and icon assets.
- `component.html` is the previous design-system reference.

The DS keeps a working copy under **Share → Saved custom share menu**, using an explicit `data-share-legacy` trigger. Normal Share buttons now prefer native sharing. This backup is preserved separately so later updates do not overwrite the original implementation.

The original JavaScript was loaded as a classic deferred script. To restore that source as the live implementation, also restore the original script-tag type; the current implementation is an ES module. The full original version is retained in Git commit dafe2b9.
