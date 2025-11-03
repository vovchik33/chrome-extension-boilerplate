# Quick Reference: Permission Justifications for Chrome Web Store

Use these justifications when filling the "Privacy practices" tab in Chrome Web Store Developer Console.

---

## activeTab

**Justification Text:**
This permission is required to access the currently active browser tab and display its domain information in the extension popup. It allows users to see which domain group the current tab belongs to and manage it accordingly. Only accesses the URL and domain of the currently active tab when the user clicks the extension icon. No browsing history is accessed, and no data from other tabs is accessed.

---

## scripting

**Justification Text:**
This permission is required to programmatically interact with browser tabs for tab management operations such as closing tabs, querying tab information, and organizing tabs into groups. Accesses tab URLs only to determine domain grouping and execute tab close operations based on user actions. No access to page content, only tab metadata.

---

## storage

**Justification Text:**
This permission is required to save user-configured domain groups, preferences, and settings locally in the browser using Chrome's storage API. Stores only user-configured domain group data and preferences - no personal information or browsing history. All data remains on the user's device and is never transmitted externally.

---

## tabs

**Justification Text:**
This permission is required to query and list all open browser tabs, access their domains and URLs for grouping purposes, and manage tabs (close, organize) based on domain groups configured by the user. Reads tab URLs and domains only for grouping purposes - no access to page content or form data. All operations are user-initiated via the popup interface.


