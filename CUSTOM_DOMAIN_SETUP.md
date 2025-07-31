# Custom Domain Setup for dmgine.com

## Issue Fixed
✅ Added `dmgine.com` and `www.dmgine.com` to CORS allowlist  
✅ Server now accepts requests from custom domain  

## Required Steps for Complete Setup

### 1. Server Configuration (✅ COMPLETED)
Updated CORS configuration in `server/index.ts` to include:
- `https://dmgine.com`
- `https://www.dmgine.com`

### 2. Firebase Console Configuration (⚠️ REQUIRED)
You need to add your custom domain to Firebase authorized domains:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `dmgine-f5b08`
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain** and add:
   - `dmgine.com`
   - `www.dmgine.com`

### 3. Replit Domain Configuration (⚠️ REQUIRED)
Configure your custom domain in Replit:

1. Go to your Replit deployment settings
2. Add custom domain: `dmgine.com`
3. Configure DNS records with your domain registrar:
   - **A Record**: Point `dmgine.com` to Replit's IP
   - **CNAME Record**: Point `www.dmgine.com` to `dmgine.com`
   - **TXT Record**: Add verification record provided by Replit

### 4. SSL Certificate
Replit should automatically provision an SSL certificate for your custom domain once DNS is properly configured.

## Current Status
- ✅ `https://dmgine.replit.app` - Working (no Firebase errors)
- ⚠️ `https://dmgine.com` - Needs Firebase domain authorization

## Testing Steps
After completing Firebase and Replit domain setup:

1. Visit `https://dmgine.com`
2. Test user authentication
3. Check browser console for any remaining errors
4. Verify Firestore operations work properly

## Common Issues

### Firebase Auth Errors on Custom Domain
**Error**: `auth/unauthorized-domain`
**Solution**: Add domain to Firebase authorized domains (Step 2 above)

### CORS Errors
**Error**: `Access to fetch blocked by CORS policy`
**Solution**: Already fixed in server configuration

### SSL Certificate Issues
**Error**: `NET::ERR_CERT_AUTHORITY_INVALID`
**Solution**: Wait for Replit to provision SSL certificate after DNS configuration

## Verification
Once setup is complete, both domains should work identically:
- Authentication should work on both domains
- Firestore operations should succeed
- No Firebase WebChannel errors
- Clean browser console logs

The server-side changes are complete. You now need to configure the Firebase Console and Replit domain settings to finish the custom domain setup.