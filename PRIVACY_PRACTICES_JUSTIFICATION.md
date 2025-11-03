# Privacy Practices - Permission Justifications

This document provides justification for each permission required by Tabs Combiner extension for the Chrome Web Store Privacy practices section.

---

## Permission Justifications

### 1. activeTab

**Justification:**
The `activeTab` permission is required to access the currently active browser tab and display its domain information in the extension popup. This allows users to see which domain group the current tab belongs to and manage it accordingly.

**Use Case:**
- Display the current tab's domain in the popup interface
- Show which domain group the active tab belongs to
- Allow users to add the current tab to a domain group
- Provide context-aware tab management features

**Data Access:**
- Only accesses the URL and domain of the currently active tab
- No browsing history is accessed
- No data from other tabs is accessed
- Only when user explicitly clicks the extension icon

**Privacy Impact:**
- Minimal: Only reads the current tab's URL/domain when popup is opened
- No persistent storage of tab information
- No transmission of data outside the browser

---

### 2. scripting

**Justification:**
The `scripting` permission is required to programmatically interact with browser tabs for tab management operations such as closing tabs, querying tab information, and organizing tabs into groups.

**Use Case:**
- Close tabs belonging to specific domain groups
- Query tab information to group tabs by domain
- Execute tab management actions (close, move, etc.)
- Interact with tabs to display grouped tab information

**Data Access:**
- Accesses tab URLs only to determine domain grouping
- Reads tab information necessary for grouping functionality
- Executes tab close operations based on user actions
- No access to page content, only tab metadata

**Privacy Impact:**
- Low: Only accesses tab URLs and domain information
- No access to page content or data
- All operations are user-initiated
- No background access to tabs

---

### 3. storage

**Justification:**
The `storage` permission is required to save user-configured domain groups, preferences, and settings locally in the browser. This allows the extension to remember user preferences and restore domain group configurations.

**Use Case:**
- Store user-created domain groups
- Save extension preferences and settings
- Remember which groups are active/inactive
- Persist domain group configurations between browser sessions
- Enable import/export functionality for domain groups

**Data Access:**
- Stores only user-configured domain group data
- Stores user preferences (no personal data)
- Stores extension settings
- All data stored locally using Chrome's storage API

**Privacy Impact:**
- None: Only stores user configuration data
- No personal information or browsing history stored
- All data remains on user's device
- No external data transmission

---

### 4. tabs

**Justification:**
The `tabs` permission is required to query and list all open browser tabs, access their domains and URLs for grouping purposes, and manage tabs (close, organize) based on domain groups configured by the user.

**Use Case:**
- Query all open tabs to determine their domains
- Group tabs by domain based on user configuration
- Display tab count per domain group in the popup
- Close multiple tabs belonging to the same domain group
- Organize tabs efficiently based on domain grouping
- Provide "close all" and "close others" functionality

**Data Access:**
- Reads tab URLs and domains for grouping purposes
- Accesses tab metadata (title, URL) to organize by domain
- No access to page content or form data
- Only accesses tab information necessary for grouping

**Privacy Impact:**
- Low: Only accesses tab URLs/domains for grouping
- No access to page content or user input
- All operations are user-initiated via popup
- Information used only for display and organization purposes
- No data is stored about specific pages visited

---

## Additional Privacy Information

### Data Collection
**None.** This extension does not collect, transmit, or store any personal data or browsing information outside the user's browser.

### Data Storage
All data is stored locally using Chrome's `chrome.storage.local` API:
- Domain group configurations
- User preferences
- Extension settings

**All data remains on the user's device and is never transmitted externally.**

### External Communication
**None.** This extension does not communicate with any external servers or services.

### User Control
Users have full control over:
- Which domain groups to create and configure
- Which groups are active/inactive
- Import/export of their domain groups
- Complete deletion of all stored data (via uninstall)

---

## Summary

All permissions requested by Tabs Combiner are essential for its core functionality of organizing and managing browser tabs by domain groups. Each permission:
- Is necessary for the stated functionality
- Has minimal privacy impact
- Does not access sensitive data beyond what's required
- Does not transmit data outside the browser
- Provides clear user benefit

The extension operates entirely locally, respects user privacy, and provides transparent tab management functionality.

