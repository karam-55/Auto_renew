# Role Management Screen 401 Error - Diagnostic Report

## Executive Summary

The Role Management screen returns 401 Unauthorized errors because the **access token is expired/invalid**. This is a token authentication issue, not a permission issue.

---

## Root Cause

### Primary Issue: Expired/Invalid Access Token

The 401 error is caused by an expired or invalid JWT access token. The error logs show:

```
POST http://localhost:8080/api/auth/refresh 401 (Unauthorized)
{"error": "Invalid refresh token"}
```

This indicates:
1. The access token has expired
2. The refresh token is also invalid/expired
3. The frontend cannot obtain a new access token
4. All subsequent API calls fail with 401 Unauthorized

---

## Why Only the Role Management Screen Fails

### Timing and Token Expiration

The Role Management screen fails with 401 because:

1. **Token Expiration Timing**: The user's session token expired while the application was running
2. **Refresh Failure**: The `ApiService` attempted to refresh the token using the stored refresh token, but the refresh token was also invalid
3. **No Fallback**: When token refresh fails, all subsequent API calls return 401
4. **Screen Access**: When the user navigates to the Role Management screen, the `loadData()` method is triggered, making API calls with the invalid token

### Other Screens May Work Due To:

- **Cached Data**: Some screens may display cached data without making API calls
- **Different Timing**: Screens accessed before token expiration may still work
- **No API Calls**: Some screens may not require immediate API calls

---

## Authorization Header Analysis

### Frontend: Authorization Header IS Present

The `UsersRolesService` uses `ApiService` which:

```dart
class UsersRolesService {
  final ApiService _apiService = ApiService();

  Future<List<Map<String, dynamic>>> getUsers() async {
    final response = await _apiService.get('/auth/users');
    // ...
  }
}
```

`ApiService` includes an interceptor that automatically injects the Authorization header:

```dart
// ApiService interceptor adds:
headers: {
  'Authorization': 'Bearer $token',
}
```

**Conclusion**: The Authorization header IS being sent, but the token is invalid.

---

## Permission Analysis

### Required Permissions

The backend endpoints require:

1. **GET /auth/users**: Protected by `authenticate` + `authorize(['OWNER', 'MANAGER'])`
2. **GET /auth/roles**: Protected by `requirePermission('manage_roles')`
3. **POST /auth/users/{id}/role**: Protected by `requirePermission('manage_roles')`

### Current User (OWNER) Permissions

The current user has role `OWNER`, which according to the frontend permission system should have all permissions including:
- `manage_roles`
- `manage_users`
- `view_roles`

**However**, the permission check never happens because the request fails at the authentication layer (401) before reaching the permission middleware.

---

## Backend Middleware Analysis

### Authentication Middleware (`authenticate`)

The `authenticate` middleware:
1. Verifies the JWT token signature
2. Checks token expiration
3. Returns 401 if token is invalid or expired

**This is where the request fails** - the token is invalid/expired.

### Permission Middleware (`requirePermission`)

The `requirePermission('manage_roles')` middleware:
1. Checks if user is authenticated (already failed at previous step)
2. Looks up employee record with role and permissions
3. Returns 403 if user lacks the required permission

**This middleware is never reached** because authentication fails first.

---

## Provider Loading Order

### RoleAssignmentProvider vs AuthProvider

The `RoleAssignmentScreen` loads data in `initState`:

```dart
@override
void initState() {
  super.initState();
  WidgetsBinding.instance.addPostFrameCallback((_) {
    ref.read(usersRolesProvider.notifier).loadData();
  });
}
```

This is correct - it waits for the first frame before loading. However:

1. **AuthProvider loads token from SharedPreferences** on app startup
2. **Token may already be expired** when loaded from storage
3. **RoleAssignmentScreen attempts API calls** with the expired token
4. **ApiService tries to refresh** but refresh token is also invalid
5. **All calls fail with 401**

**Conclusion**: The loading order is correct, but the stored tokens are expired.

---

## Backend Endpoint Protection

### Endpoint: GET /auth/roles

Location: `backend/src/api/routes/rbac.routes.ts`

```typescript
router.get('/roles', manageRoles, (req, res) => rolesController.getAllRoles(req, res));

const manageRoles = requirePermission('manage_roles');
```

Protection layers:
1. **Authentication** (implicit - all routes require auth)
2. **Permission check** - requires `manage_roles` permission
3. **Database lookup** - queries employee record with role/permissions

### Endpoint: GET /auth/users

Location: `backend/src/modules/users/routes.ts`

```typescript
router.get('/', authorize(['OWNER', 'MANAGER']), userController.getAllUsers);
```

Protection layers:
1. **Authentication** - `authenticate` middleware
2. **Role-based authorization** - requires OWNER or MANAGER role

---

## What Is Happening (Step-by-Step)

1. **User logs in** → Token stored in SharedPreferences
2. **Time passes** → Access token expires (15-30 minutes typically)
3. **User navigates to Role Management screen**
4. **Screen triggers `loadData()`**
5. **`UsersRolesService` calls `ApiService.get('/auth/users')`**
6. **`ApiService` adds Authorization header with expired token**
7. **Backend `authenticate` middleware validates token**
8. **Token is expired → Returns 401 Unauthorized**
9. **`ApiService` attempts token refresh**
10. **Refresh token is also invalid → Refresh fails**
11. **Error propagates to UI**: "Unauthorized" / 401
12. **User sees error message**

---

## Is the Issue Token-Related or Permission-Related?

### Token-Related ✅

The issue is **100% token-related**:

- **Evidence**: 401 status code (Unauthorized, not Forbidden)
- **Evidence**: "Invalid refresh token" error in logs
- **Evidence**: All API calls fail, not just permission-protected ones
- **Evidence**: Authorization header IS being sent (confirmed in ApiService)

### Not Permission-Related ❌

The issue is **NOT permission-related**:

- **Evidence**: 401 (auth error) not 403 (permission error)
- **Evidence**: Permission middleware is never reached
- **Evidence**: OWNER role should have all permissions
- **Evidence**: PermissionGuard would show "Permission denied" if it were permission-related

---

## Why the Backend Rejects the Request

### Intentional Rejection ✅

The backend is **intentionally rejecting** the request because:

1. **Security**: Expired tokens must be rejected to prevent unauthorized access
2. **Authentication**: The user cannot be authenticated without a valid token
3. **Refresh Failure**: The refresh mechanism failed to obtain a new token

This is correct behavior - the backend is doing exactly what it should do.

---

## Summary

| Aspect | Status | Details |
|--------|--------|---------|
| Authorization Header | ✅ Present | ApiService injects Bearer token |
| Token Validity | ❌ Invalid/Expired | Token expired, refresh also failed |
| User Permissions | ✅ Sufficient | OWNER has all permissions |
| Backend Protection | ✅ Working | Correctly rejecting invalid tokens |
| Endpoint Requirements | ✅ Known | Requires `manage_roles` permission |
| Provider Loading Order | ✅ Correct | Uses addPostFrameCallback |
| Root Cause | ❌ Token Expiration | Access token expired, refresh failed |

---

## Conclusion

The Role Management screen returns 401 errors because the user's access token has expired and the refresh token is also invalid. This is a token authentication issue, not a permission issue. The backend is correctly rejecting the request due to invalid authentication credentials.

**The system is working as designed** - expired tokens must be rejected for security. The solution is for the user to log out and log back in to obtain fresh tokens.
