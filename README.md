# Tabs Combiner

A Chrome extension that helps you efficiently manage and organize browser tabs by grouping them based on domains.

## Features

- **Domain-based Tab Grouping**: Automatically group tabs by their domain
- **Quick Tab Management**: Close all tabs, close other tabs, or manage specific groups
- **Customizable Groups**: Create and manage custom domain groups in the options page
- **Easy Access**: Quick access popup for managing tabs
- **Storage Persistence**: Your groups and preferences are saved locally

## Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) page for Tabs Combiner
2. Click "Add to Chrome"
3. Confirm the installation

### Development Installation
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build:prod` to create a production build
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `builds/latest` directory

## Building

### Development Build
```bash
npm run build
```

### Production Build (with obfuscation and minification)
```bash
npm run build:prod
```

### Clean Build
```bash
npm run build:clean
```

### Watch Mode (automatic rebuild on file changes)
```bash
npm run build:watch
```

## Version Management

### Bump Patch Version (0.0.0 → 0.0.1)
```bash
npm run version:patch
```

### Bump Minor Version (0.0.0 → 0.1.0)
```bash
npm run version:minor
```

### Bump Major Version (0.0.0 → 1.0.0)
```bash
npm run version:major
```

The version script will:
- Update version in `manifest.json` and `package.json`
- Create a git commit with the version change
- Create a git tag (e.g., `v0.0.1`)
- Automatically build the extension

## Project Structure

```
chrome-extension-boilerplate/
├── src/                    # Source files
│   ├── manifest.json       # Extension manifest
│   ├── popup.html          # Popup interface
│   ├── popup.js            # Popup logic
│   ├── popup_styles.scss   # Popup styles
│   ├── options.html        # Options page
│   ├── options.js          # Options page logic
│   ├── options_styles.scss # Options page styles
│   └── images/             # Extension icons
├── builds/                 # Build output
│   ├── latest/             # Latest unpacked build
│   └── *.zip               # Versioned builds
├── build.js                # Build script
├── version.js              # Version management script
└── package.json            # Node.js dependencies
```

## Development

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup
```bash
npm install
```

### Development Workflow
1. Make changes to files in the `src/` directory
2. Run `npm run build:watch` for automatic rebuilding
3. Or run `npm run build` after making changes
4. Reload the extension in Chrome to test changes

## Chrome Web Store Submission

### Requirements Checklist
- [x] Manifest v3 compliant
- [x] Privacy policy (create privacy-policy.md)
- [x] Store listing images (128x128, 48x48 icons)
- [x] Promotional images (if needed)
- [x] Description and screenshots

### Build for Submission
```bash
npm run build:prod
```

The production build will be in `builds/tabs-combiner_X_X_X.zip`

### Submission Steps
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Create a new item
3. Upload the ZIP file from `builds/tabs-combiner_X_X_X.zip`
4. Fill in store listing details
5. Submit for review

## Permissions

This extension uses the following permissions:
- `activeTab` - Access to the currently active tab
- `scripting` - Execute scripts to interact with tabs
- `storage` - Save your tab groups and preferences
- `tabs` - Query and manage browser tabs

## Privacy

This extension:
- Does not collect or transmit any personal data
- Stores all data locally in your browser
- Does not communicate with external servers
- Respects your privacy

See [PRIVACY.md](PRIVACY.md) for detailed privacy information.

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, feature requests, or questions, please open an issue on the GitHub repository.

## Changelog

### Version 0.0.0
- Initial release
- Domain-based tab grouping
- Options page for managing groups
- Quick tab management features

