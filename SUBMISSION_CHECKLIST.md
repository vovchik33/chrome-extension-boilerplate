# Chrome Web Store Submission Checklist

Use this checklist before submitting your extension to ensure everything is ready.

## Pre-Submission

### Code Quality
- [ ] Extension works correctly in all scenarios
- [ ] No console errors or warnings
- [ ] Production build created (`npm run build:prod`)
- [ ] ZIP file tested by loading unpacked in Chrome
- [ ] All features tested thoroughly
- [ ] Error handling implemented
- [ ] Code is clean and well-structured

### Manifest.json
- [ ] Version number is appropriate (not 0.0.0 for production release)
- [ ] Icons defined for 16x16, 48x48, and 128x128
- [ ] Description is clear and accurate
- [ ] All permissions are justified
- [ ] Options page is properly configured
- [ ] Action popup is configured

### Assets
- [ ] Extension icon (128x128 PNG) - required
- [ ] Extension icon (48x48 PNG) - required
- [ ] Screenshots prepared (at least 1, up to 5)
  - [ ] Screenshot 1: Main popup interface
  - [ ] Screenshot 2: Options page
  - [ ] Screenshot 3: Tab grouping feature
  - [ ] Screenshot 4: (optional)
  - [ ] Screenshot 5: (optional)
- [ ] Promotional images (optional but recommended)
  - [ ] Small tile: 440x280
  - [ ] Marquee tile: 920x680
  - [ ] Large tile: 1400x560

### Documentation
- [ ] README.md created
- [ ] PRIVACY.md created
- [ ] LICENSE file created
- [ ] Privacy policy URL is publicly accessible
- [ ] Store listing description written
- [ ] Detailed description prepared

### Store Listing
- [ ] Name: Tabs Combiner
- [ ] Short description (132 characters max)
- [ ] Full description written
- [ ] Category selected (Productivity/Tools)
- [ ] Language set to English
- [ ] Distribution set (Public/Unlisted)
- [ ] Pricing set to Free

### Privacy & Security
- [ ] Privacy policy URL accessible
- [ ] Privacy policy covers all data handling
- [ ] No personal data collection
- [ ] All permissions justified in description
- [ ] Extension complies with Chrome Web Store policies

### Testing
- [ ] Extension works on different websites
- [ ] Popup opens and functions correctly
- [ ] Options page works
- [ ] Data persists correctly
- [ ] No broken features
- [ ] Edge cases handled

## Submission Steps

1. [ ] Go to Chrome Web Store Developer Dashboard
2. [ ] Click "New Item"
3. [ ] Upload ZIP file from `builds/tabs-combiner_X_X_X.zip`
4. [ ] Wait for upload and validation
5. [ ] Fill in all store listing information
6. [ ] Upload screenshots
7. [ ] Add privacy policy URL
8. [ ] Review all information
9. [ ] Submit for review

## Post-Submission

### While Waiting
- [ ] Check email for review status updates
- [ ] Be ready to respond to any questions from reviewers
- [ ] Monitor for any policy violations

### If Rejected
- [ ] Read rejection reason carefully
- [ ] Address all issues mentioned
- [ ] Update extension if needed
- [ ] Resubmit after fixes

### If Approved
- [ ] Extension is live on Chrome Web Store
- [ ] Share the store link
- [ ] Monitor user reviews and ratings
- [ ] Plan for future updates

## Common Issues to Avoid

- ❌ Missing privacy policy URL
- ❌ Insufficient description
- ❌ Missing required icons
- ❌ Permissions not justified
- ❌ Using development build instead of production
- ❌ Version number is 0.0.0
- ❌ Broken functionality
- ❌ Policy violations

## Notes

- Review process typically takes 1-7 business days
- First submission may take longer
- Updates are usually reviewed faster
- Keep your developer account active

Good luck! 🚀

