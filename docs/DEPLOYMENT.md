# Deployment Guide

## Overview
Complete guide for deploying the Rooftop Detector extension to production, including Chrome Web Store submission, versioning, and updates.

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Chrome Web Store Submission](#chrome-web-store-submission)
3. [Version Management](#version-management)
4. [Update Process](#update-process)
5. [Distribution Channels](#distribution-channels)
6. [Monitoring](#monitoring)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] **All tests passing**
  ```bash
  npm run test
  ```

- [ ] **No console errors in production build**
  - Open extension
  - Check all DevTools consoles (background, popup, content)
  - No errors or warnings

- [ ] **TypeScript compiles without errors**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Webpack builds successfully**
  ```bash
  npm run build
  # Should complete without errors
  ```

- [ ] **Code linting passed**
  ```bash
  npm run lint  # If you have linting set up
  ```

### Functionality

- [ ] **All features working**
  - Single detection works
  - Continuous detection works
  - Confidence threshold adjusts properly
  - Clear overlays works
  - Settings persist

- [ ] **Tested on multiple websites**
  - Google Maps ✓
  - Real estate sites ✓
  - Satellite imagery ✓

- [ ] **Tested in different browsers**
  - Chrome ✓
  - Edge ✓ (Chromium-based)

- [ ] **Performance acceptable**
  - Inference <100ms
  - Memory <200MB
  - No UI lag

### Assets & Documentation

- [ ] **All assets present**
  ```bash
  # Check required files
  ls build/model/rooftop-detector.onnx
  ls build/images/icons/icon*.png
  ls build/popup.html
  ls build/manifest.json
  ```

- [ ] **Icons correct sizes**
  - icon16.png (16x16)
  - icon48.png (48x48)
  - icon128.png (128x128)
  - icon380.png (380x380)

- [ ] **README updated**
  - Version number correct
  - Features listed
  - Installation instructions
  - Screenshots included

- [ ] **CHANGELOG created**
  - Version history documented
  - Breaking changes noted

### Legal & Privacy

- [ ] **Privacy policy created**
  - Data collection disclosure
  - Screen capture usage explained
  - No external servers statement

- [ ] **License file present**
  - GPL-3.0 or your chosen license
  - Copyright year correct

- [ ] **No hardcoded credentials**
  - No API keys in code
  - No passwords or secrets

---

## Chrome Web Store Submission

### Step 1: Create Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Sign in with Google account
3. Pay one-time $5 developer registration fee
4. Verify email address

### Step 2: Prepare Store Assets

#### 2.1 Screenshots (Required)

Create 1280x800 or 640x400 screenshots:

```bash
# Recommended tool: Chrome's built-in screenshot
# 1. Open extension on test page
# 2. Activate detection
# 3. Press F12 → Console → Cmd+Shift+P → "Capture screenshot"
```

Required screenshots (3-5 recommended):
1. **Hero shot**: Extension detecting rooftops on Google Maps
2. **Popup interface**: Show extension popup with controls
3. **Detection examples**: Various websites with detections
4. **Settings**: Confidence threshold adjustment
5. **Stats**: Detection count and performance metrics

#### 2.2 Promotional Images

**Small tile** (440x280):
```
- Extension icon
- "Rooftop Detector" text
- "AI-Powered Detection" subtitle
```

**Large tile** (920x680):
```
- Hero image showing detection in action
- Feature highlights
- "YOLO11 AI Model" badge
```

**Marquee** (1400x560, optional):
```
- Banner-style promotional image
- Key features listed
- Call to action
```

#### 2.3 Store Description

**Short description** (132 characters max):
```
AI-powered rooftop detection for browser content using YOLO11 model. Fast, accurate, and privacy-focused.
```

**Detailed description** (up to 16,000 characters):

```markdown
# Rooftop Detector - AI-Powered Detection

Detect rooftops in browser content with state-of-the-art YOLO11 AI model. Perfect for real estate professionals, urban planners, and anyone working with aerial imagery.

## 🎯 Key Features

✅ **Real-Time Detection** - Instant rooftop detection on any webpage
✅ **High Accuracy** - YOLO11 model trained on 10,000+ images
✅ **Privacy-First** - All processing happens locally in your browser
✅ **Fast Performance** - <50ms inference time on modern hardware
✅ **Easy to Use** - Simple one-click detection interface
✅ **Adjustable Sensitivity** - Fine-tune confidence threshold

## 🚀 How It Works

1. Navigate to any page with rooftop imagery (Google Maps, real estate sites, etc.)
2. Click the extension icon
3. Click "Detect Once" or "Start Detection"
4. View detected rooftops with visual overlays

## 💡 Use Cases

- **Real Estate**: Quickly identify properties with aerial views
- **Urban Planning**: Analyze rooftop distribution in cities
- **Solar Energy**: Find suitable rooftops for solar panel installation
- **Research**: Academic research on urban development
- **Personal**: Explore neighborhoods via satellite imagery

## 🔧 Technical Details

- **Model**: YOLO11 Nano (latest 2024 model)
- **Backend**: ONNX Runtime Web with WebGL/WebGPU
- **Size**: ~10MB (lightweight)
- **Platforms**: Chrome 90+, Edge 90+

## 🔒 Privacy & Security

- ✅ All AI processing runs locally in your browser
- ✅ No data sent to external servers
- ✅ Screen captures are temporary and not saved
- ✅ Open source code available on GitHub

## 📊 Performance

- Inference time: 10-50ms
- Memory usage: <150MB
- Supports real-time detection at 0.5-1 FPS

## 🆘 Support

Visit our GitHub repository for:
- Documentation
- Bug reports
- Feature requests
- Source code

GitHub: https://github.com/ReedKrawiec/Board-Explorer

## 📝 Version History

**v2.0.0** - Initial release
- YOLO11 model integration
- Real-time detection
- Adjustable confidence threshold
- Performance optimizations

---

**Note**: This extension requires screen capture permission to analyze page content. Permission is only used when you explicitly activate detection.
```

### Step 3: Upload Extension

1. **Create Distribution Package**
```bash
cd ~/Board-Explorer

# Clean build
npm run clean
npm run build

# Create ZIP
cd build
zip -r ../rooftop-detector-v2.0.0.zip . -x '*.DS_Store' -x '__MACOSX/*' -x '*.map'

# Verify ZIP
cd ..
unzip -l rooftop-detector-v2.0.0.zip
```

2. **Upload to Chrome Web Store**
- Go to Developer Dashboard
- Click "New Item"
- Upload `rooftop-detector-v2.0.0.zip`
- Wait for upload to complete

### Step 4: Fill Store Listing

**Package details:**
- **Name**: Rooftop Detector
- **Summary**: AI-powered rooftop detection using YOLO11
- **Category**: Productivity
- **Language**: English

**Privacy:**
- **Single purpose**: Detect rooftops in browser content
- **Permission justification**:
  - `desktopCapture`: Required to capture screen content for AI analysis
  - `storage`: Save user settings and preferences
  - `activeTab`: Access current tab for content analysis
- **Data usage**: No user data is collected or transmitted
- **Certification**: Check "This extension does not collect user data"

**Pricing:**
- **Free**

**Distribution:**
- **Public** (or Unlisted for testing)
- **Regions**: All regions

### Step 5: Submit for Review

1. Click "Submit for Review"
2. Wait for Google's automated checks (5-10 minutes)
3. Manual review (1-3 business days typical)
4. Check email for review status

### Step 6: Handle Review Feedback

If rejected:
1. Read rejection reason carefully
2. Make required changes
3. Update version number
4. Resubmit

Common rejection reasons:
- Permissions not justified
- Misleading description
- Privacy policy missing
- Functionality not as described

---

## Version Management

### Semantic Versioning

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (2.0.0 → 3.0.0)
- **MINOR**: New features, backward compatible (2.0.0 → 2.1.0)
- **PATCH**: Bug fixes (2.0.0 → 2.0.1)

### Version Update Process

1. **Update manifest.json**
```json
{
    "version": "2.1.0"
}
```

2. **Update package.json**
```json
{
    "version": "2.1.0"
}
```

3. **Update CHANGELOG.md**
```markdown
## [2.1.0] - 2026-01-15

### Added
- Continuous detection mode
- Performance improvements

### Fixed
- Memory leak in long sessions
- Overlay positioning on scrolled pages

### Changed
- Updated YOLO11 model to latest version
```

4. **Git Tag**
```bash
git add .
git commit -m "Release v2.1.0"
git tag -a v2.1.0 -m "Release version 2.1.0"
git push origin main
git push origin v2.1.0
```

---

## Update Process

### Creating an Update

1. **Make Changes**
```bash
# Fix bugs, add features
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"
```

2. **Test Thoroughly**
```bash
npm run build
# Load extension locally
# Test all functionality
```

3. **Update Version**
```bash
# Update manifest.json version
# Update package.json version
# Update CHANGELOG.md
```

4. **Build & Package**
```bash
npm run clean
npm run build
cd build
zip -r ../rooftop-detector-v2.1.0.zip .
```

5. **Upload to Chrome Web Store**
- Go to Developer Dashboard
- Click on extension
- Upload new ZIP
- Update store listing if needed
- Submit for review

6. **Rollout**
- Updates are automatic for users
- Rollout typically takes 1-2 days
- Users get update when Chrome restarts

### Emergency Hotfix

For critical bugs:

1. **Create Hotfix Branch**
```bash
git checkout -b hotfix/critical-bug
```

2. **Fix & Test**
```bash
# Fix the bug
npm run build
# Quick smoke test
```

3. **Fast-Track Version**
```bash
# Increment patch version
# e.g., 2.0.0 → 2.0.1
```

4. **Submit Urgently**
- Upload to Chrome Web Store
- Mark as critical in notes to reviewer
- Request expedited review

---

## Distribution Channels

### Chrome Web Store (Primary)

**Pros:**
- Automatic updates
- User trust
- Discoverability
- Built-in analytics

**Cons:**
- Review process required
- Google's policies
- 5-day review time

### Direct Distribution (Alternative)

For enterprise or testing:

1. **Create CRX File**
```bash
# Package extension with private key
google-chrome --pack-extension=./build --pack-extension-key=./key.pem
# Creates: build.crx
```

2. **Host CRX File**
```bash
# Upload to your server
scp build.crx user@server:/var/www/extensions/
```

3. **Create Update XML**
```xml
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='YOUR_EXTENSION_ID'>
    <updatecheck codebase='https://yoursite.com/extensions/rooftop-detector.crx' version='2.0.0' />
  </app>
</gupdate>
```

4. **Add to Manifest**
```json
{
    "update_url": "https://yoursite.com/extensions/updates.xml"
}
```

### GitHub Releases

For open-source distribution:

```bash
# Create release on GitHub
gh release create v2.0.0 \
    rooftop-detector-v2.0.0.zip \
    --title "Rooftop Detector v2.0.0" \
    --notes "Release notes here"
```

---

## Monitoring

### User Analytics

Add Google Analytics (optional):

```javascript
// In background.ts
const TRACKING_ID = 'UA-XXXXX-Y';

function trackEvent(category: string, action: string, label?: string) {
    fetch(`https://www.google-analytics.com/collect`, {
        method: 'POST',
        body: new URLSearchParams({
            v: '1',
            tid: TRACKING_ID,
            cid: 'unique-user-id',
            t: 'event',
            ec: category,
            ea: action,
            el: label || ''
        })
    });
}

// Track detection usage
trackEvent('detection', 'run', 'single');
```

### Error Tracking

Add Sentry for error monitoring:

```bash
npm install @sentry/browser
```

```typescript
// In background.ts
import * as Sentry from '@sentry/browser';

Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: 'production'
});

// Errors are automatically captured
```

### Chrome Web Store Dashboard

Monitor:
- **Install count**: Total installations
- **Weekly users**: Active user count
- **Rating**: User satisfaction
- **Reviews**: User feedback
- **Crashes**: Stability metrics

Access at: https://chrome.google.com/webstore/devconsole/

---

## Maintenance Schedule

### Weekly
- Check Chrome Web Store reviews
- Monitor error rates
- Review analytics

### Monthly
- Update dependencies
- Security audit
- Performance testing

### Quarterly
- Review and update documentation
- Major feature releases
- User survey

---

## Rollback Procedure

If critical issue discovered:

1. **Identify Issue**
```bash
# Check error logs
# Reproduce bug
# Assess severity
```

2. **Quick Fix or Rollback?**

**Quick fix** if:
- Simple one-line fix
- Easy to test
- Low risk

**Rollback** if:
- Complex issue
- Affects many users
- Security vulnerability

3. **Rollback Steps**
```bash
# Revert to previous version
git checkout v2.0.0

# Build
npm run build

# Package
cd build && zip -r ../rooftop-detector-v2.0.0.zip .

# Upload to Chrome Web Store
# (Use same version number, describe issue in review notes)
```

4. **Communicate**
- Update store description with known issue
- Post on GitHub about rollback
- Email users if critical

---

## Success Metrics

### KPIs to Track

**Adoption:**
- Daily active users (DAU)
- Monthly active users (MAU)
- Install rate
- Uninstall rate

**Engagement:**
- Detections per user
- Average session duration
- Feature usage rates

**Quality:**
- Crash rate (<1%)
- Average rating (>4.0)
- Response time to issues (<24h)

**Performance:**
- Average inference time (<50ms)
- Memory usage (<150MB)
- Load time (<2s)

---

## Launch Checklist

Final checks before going live:

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Screenshots taken
- [ ] Store listing written
- [ ] Privacy policy published
- [ ] GitHub repository public
- [ ] Support email set up
- [ ] Analytics configured
- [ ] Version tagged in Git
- [ ] Backup of production code
- [ ] Rollback plan ready
- [ ] Team notified
- [ ] Monitoring active

---

## Post-Launch

### Day 1
- Monitor for crashes
- Watch for reviews
- Check installation rate
- Respond to issues

### Week 1
- Analyze usage patterns
- Gather user feedback
- Plan first update
- Fix critical bugs

### Month 1
- Review analytics
- Plan major features
- Engage with community
- Optimize performance

---

## Support Resources

**Chrome Web Store Help:**
https://developer.chrome.com/docs/webstore/

**Extension Best Practices:**
https://developer.chrome.com/docs/extensions/mv3/

**Manifest V3 Migration:**
https://developer.chrome.com/docs/extensions/mv3/intro/

**Publishing Guide:**
https://developer.chrome.com/docs/webstore/publish/

---

## Conclusion

✅ **Deployment guide complete!**

Your extension is ready for production deployment. Follow this guide step-by-step to successfully launch on the Chrome Web Store.

**Next steps:**
1. Complete pre-deployment checklist
2. Create store assets
3. Submit to Chrome Web Store
4. Monitor and iterate

Good luck with your launch! 🚀
