# Chrome Web Store Submission Guide

This guide will help you submit Tabs Combiner to the Chrome Web Store.

## Prerequisites

1. **Google Developer Account**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay a one-time $5 registration fee (if not already done)
   - Verify your identity

2. **Required Assets**
   - ✅ Extension ZIP file (production build)
   - ✅ Privacy Policy (PRIVACY.md)
   - ✅ Store listing details
   - ✅ Screenshots (1280x800 or 640x400)
   - ✅ Promotional images (optional but recommended)

## Step 1: Prepare Production Build

```bash
npm run build:prod
```

This creates an optimized, obfuscated build in `builds/tabs-combiner_X_X_X.zip`

**Important:** Use the production build for submission, not the development build.

## Step 2: Prepare Store Assets

### Required Icons
You need these icon sizes (all should be in `src/images/`):
- 128x128 (required)
- 48x48 (required)
- 16x16 (for favicon, optional)

### Store Listing Images
- **Screenshots**: 1280x800 or 640x400 (at least 1 required, up to 5)
- **Small promotional tile**: 440x280 (optional)
- **Marquee promotional tile**: 920x680 (optional)
- **Large promotional tile**: 1400x560 (optional)

### Privacy Policy
Create a hosted privacy policy page or use the provided PRIVACY.md file.
You'll need to host it at a public URL.

## Step 3: Create Store Listing

### Basic Information
- **Name**: Tabs Combiner
- **Summary**: Short description (132 characters max)
- **Description**: Full description of features and functionality
- **Category**: Choose "Productivity" or "Tools"

### Detailed Description Template
```
Tabs Combiner helps you efficiently manage and organize browser tabs by grouping them based on domains.

Key Features:
• Automatic domain-based tab grouping
• Quick tab management (close all, close others)
• Customizable domain groups
• Easy-to-use popup interface
• Privacy-focused (all data stored locally)

Perfect for users who manage many tabs and want better organization.
```

### Store Listing Images
Upload screenshots showing:
1. Main popup interface
2. Options page
3. Tab grouping in action
4. Settings/configuration

## Step 4: Submission Process

1. **Go to Developer Dashboard**
   - Visit https://chrome.google.com/webstore/devconsole
   - Click "New Item"

2. **Upload ZIP File**
   - Upload `builds/tabs-combiner_X_X_X.zip`
   - Wait for upload to complete

3. **Fill Store Listing**
   - Add all required information
   - Upload screenshots
   - Add promotional images (optional)
   - Add privacy policy URL
   - Set pricing (Free)
   - Select distribution (Public or Unlisted)

4. **Review Submission**
   - Double-check all information
   - Ensure privacy policy URL is accessible
   - Verify screenshots and descriptions are accurate

5. **Submit for Review**
   - Click "Submit for Review"
   - Wait for review (typically 1-7 days)

## Step 5: After Submission

### Review Process
- Google reviews your extension for policy compliance
- Review typically takes 1-7 business days
- You'll receive email notifications about status changes

### Common Rejection Reasons
- Privacy policy not accessible
- Missing or unclear description
- Insufficient screenshots
- Permission justification needed
- Policy violations

### Approval
Once approved:
- Your extension will be live on the Chrome Web Store
- Users can find and install it
- You can update it by uploading new versions

## Updating Your Extension

When you want to release an update:

1. Bump the version:
   ```bash
   npm run version:patch  # or :minor, :major
   ```

2. This automatically:
   - Updates version numbers
   - Creates a commit
   - Creates a git tag
   - Builds the extension

3. Create production build:
   ```bash
   npm run build:prod
   ```

4. Upload new ZIP to Chrome Web Store Developer Dashboard
5. Submit for review (updates are usually reviewed faster)

## Store Listing Optimization Tips

1. **Use Clear Screenshots**: Show the extension in action
2. **Write Detailed Description**: Explain all features clearly
3. **Use Keywords**: Include relevant keywords in description
4. **Regular Updates**: Keep your extension updated
5. **Respond to Reviews**: Engage with user feedback

## Resources

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Web Store Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)

## Checklist Before Submission

- [ ] Production build created (`npm run build:prod`)
- [ ] ZIP file tested (load unpacked in Chrome)
- [ ] Privacy policy URL accessible
- [ ] All required screenshots prepared (at least 1)
- [ ] Store listing description written
- [ ] Icons prepared (128x128, 48x48)
- [ ] Extension tested thoroughly
- [ ] Permissions justified in description
- [ ] No console errors in production build
- [ ] Version number is appropriate (not 0.0.0 for production)

Good luck with your submission! 🚀

