# Google Integration Security Fixes - Summary

## Issues Identified by Architect Review

1. **Critical**: Placeholder access tokens preventing Google API calls
2. **Critical**: User/org identification via insecure query parameters
3. **Critical**: Weak OAuth state signing with fallback secret
4. **Severe**: Missing encrypted token storage implementation
5. **Severe**: No token refresh mechanism

## Fixes Implemented

### 1. Authentication Middleware (`server/middleware/auth.ts`)

Created secure authentication middleware to extract user context from session:

- `extractAuthUser`: Extracts userId, email, role, orgId from Bearer token
- `requireAuth`: Enforces authentication requirement  
- `requireOrgContext`: Ensures organization context is present

**Security improvement**: All Google routes now use authenticated session context instead of accepting user/org via query parameters.

### 2. Token Encryption (`server/utils/encryption.ts`)

Implemented AES-256-GCM encryption for OAuth refresh tokens:

- `encryptToken(plaintext)`: Encrypts refresh token before database storage
- `decryptToken(encrypted)`: Decrypts refresh token for API calls
- Uses PBKDF2 key derivation with 100,000 iterations
- Format: `salt.iv.tag.ciphertext` (all base64-encoded)
- Authenticated encryption prevents tampering

**Security improvement**: Refresh tokens are now encrypted at rest in the database.

### 3. Token Management (`server/integrations/google/token-manager.ts`)

Implemented secure token lifecycle management:

- `getValidAccessToken()`: Retrieves valid access token, auto-refreshes if expired
- `storeOAuthTokens()`: Encrypts and stores OAuth tokens after authorization
- `revokeGoogleAccess()`: Safely revokes and deletes OAuth connection

**Security improvement**: Replaced placeholder tokens with real, auto-refreshing access tokens.

### 4. OAuth Security (`server/integrations/google/oauth.ts`)

Hardened OAuth state parameter signing:

- Removed `'default-secret'` fallback
- Now throws error if `APP_JWT_SECRET` is missing
- Validates state timestamp (5-minute expiry)
- HMAC-SHA256 signature verification

**Security improvement**: OAuth flow now fails fast if security configuration is missing.

### 5. Updated Google Auth Routes (`server/routes/google-auth.ts`)

- Uses `extractAuthUser` middleware on all routes
- `GET /auth/google/login`: Requires authentication, gets user/org from session
- `GET /auth/google/callback`: Stores encrypted tokens via `storeOAuthTokens`
- `DELETE /auth/google/disconnect`: Requires authentication, validates user ownership

**Security improvement**: All routes now use authenticated session context.

### 6. Updated Google Calendar Routes (`server/routes/google-calendar.ts`)

- Uses `extractAuthUser` middleware on all routes
- `POST /api/google/meet`: Uses `getValidAccessToken()` for real tokens
- `GET /api/google/freebusy`: Uses `getValidAccessToken()` for real tokens  
- `GET /api/google/connection-status`: Checks auth from session context

**Security improvement**: Replaced all placeholder tokens with secure, auto-refreshing access tokens.

### 7. Database Schema Updates (`shared/schema.ts`)

Added new columns to `connected_accounts` table:

```typescript
encryptedRefreshToken: text("encrypted_refresh_token"), // Encrypted OAuth refresh token
lastUsedAt: timestamp("last_used_at"),
connectedAt: timestamp("connected_at").defaultNow().notNull(),
```

**Migration SQL**: `migrations/add-encrypted-refresh-token.sql` (run manually in Supabase)

## Environment Variables Required

All credentials are now stored in Replit Secrets:

- ✅ `GOOGLE_CLIENT_ID` - OAuth client ID
- ✅ `GOOGLE_CLIENT_SECRET` - OAuth client secret
- ✅ `GOOGLE_REDIRECT_URI` - OAuth callback URL
- ✅ `APP_JWT_SECRET` - Secret for OAuth state signing and token encryption (32+ chars)

## Security Checklist

- [x] No credentials hardcoded in source code
- [x] OAuth refresh tokens encrypted at rest (AES-256-GCM)
- [x] OAuth state parameters cryptographically signed
- [x] User/org context from authenticated session only
- [x] Access tokens auto-refresh when expired
- [x] Fail-fast if security configuration missing
- [x] All Google routes require authentication
- [x] Row-level security policies in database

## Testing Steps

1. **Run Database Migration**:
   - Copy `migrations/add-encrypted-refresh-token.sql`
   - Run in Supabase SQL Editor
   - Verify columns added: `encrypted_refresh_token`, `last_used_at`, `connected_at`

2. **Verify Environment Secrets**:
   - Check all 4 secrets exist in Replit Secrets
   - Restart application to load secrets

3. **Test OAuth Flow**:
   - Navigate to `/settings/integrations`
   - Click "Connect Google Account"
   - Complete OAuth authorization
   - Verify connection shows your email

4. **Test Google Meet Creation**:
   - Go to Messages page (with `VITE_ENABLE_GOOGLE_INTEGRATION=true`)
   - Click "Add Video Call" > "Google Meet"
   - Verify Meet link is created
   - Check database: `calendar_events` table has new record

5. **Test Token Refresh**:
   - Wait for access token to expire (or manually set `access_token_expires_at` to past)
   - Try creating another Google Meet
   - Should auto-refresh and succeed

## Production Recommendations

1. **Token Encryption**:
   - Current implementation uses APP_JWT_SECRET for encryption key derivation
   - For production, consider using a dedicated encryption key
   - Consider AWS KMS or Google Cloud KMS for key management

2. **Token Rotation**:
   - Implement regular token rotation policy
   - Revoke tokens after extended inactivity

3. **Audit Logging**:
   - Log all OAuth connection/disconnection events
   - Log all Google API calls with timestamps

4. **Rate Limiting**:
   - Add rate limiting to Google API routes
   - Prevent abuse of calendar event creation

5. **Monitoring**:
   - Alert on token refresh failures
   - Monitor encryption/decryption errors
   - Track OAuth callback failures

## Files Modified

**New Files**:
- `server/middleware/auth.ts` - Authentication middleware
- `server/utils/encryption.ts` - AES-256-GCM encryption utilities
- `server/integrations/google/token-manager.ts` - Token lifecycle management
- `migrations/add-encrypted-refresh-token.sql` - Database migration

**Modified Files**:
- `server/routes/google-auth.ts` - Secure OAuth flow
- `server/routes/google-calendar.ts` - Real token usage
- `server/integrations/google/oauth.ts` - Hardened state signing
- `shared/schema.ts` - Added encrypted token columns

## Breaking Changes

None - All changes are backward compatible. The feature flag `VITE_ENABLE_GOOGLE_INTEGRATION` controls visibility.
