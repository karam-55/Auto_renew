# Firebase Cloud Messaging (FCM) Setup Guide

## Overview
This guide explains how to set up Firebase Cloud Messaging for push notifications in the Garage Go 2.0 system.

## ⚠️ Important Notes
- **NO EMAILS** - Do not use email for any Firebase configuration or communication
- Use phone/WhatsApp for all user communications
- This is optional for Phase 5 - can be implemented later

## Prerequisites
- Google account
- Firebase project
- Flutter project (mechanic_app)

## Step-by-Step Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `garage-go-2.0`
4. **DO NOT** enable Google Analytics (optional)
5. Click "Create project"

### 2. Add Android App

1. In Firebase Console, click the Android icon (Android)
2. Package name: `com.garagego.mechanic`
3. **DO NOT** add SHA-1 fingerprints (optional for development)
4. Register app
5. Download `google-services.json`
6. Place it in `mechanic_app/android/app/`

### 3. Add iOS App (Optional)

1. In Firebase Console, click the iOS icon (iOS)
2. Bundle ID: `com.garagego.mechanic`
3. Register app
4. Download `GoogleService-Info.plist`
5. Place it in `mechanic_app/ios/Runner/`

### 4. Enable Cloud Messaging

1. In Firebase Console, go to Project Settings
2. Navigate to "Cloud Messaging" tab
3. **DO NOT** add server key (use default)
4. Copy the Server Key and Sender ID
5. Add these to `backend/.env`:
   ```
   FCM_PROJECT_ID="your-project-id"
   FCM_PRIVATE_KEY="your-private-key"
   ```

### 5. Backend Configuration

The backend already has Firebase Admin SDK configured. Just add the environment variables:

```env
# Firebase Cloud Messaging
FCM_PROJECT_ID="garage-go-2-0"
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----\n"
```

### 6. Mechanic App Configuration

Update `mechanic_app/pubspec.yaml`:

```yaml
dependencies:
  firebase_messaging: ^14.0.0
  firebase_core: ^2.0.0
```

Add to `mechanic_app/android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
```

Add to `mechanic_app/android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

### 7. Initialize Firebase in Mechanic App

In `mechanic_app/lib/main.dart`:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  // ... rest of your code
}
```

### 8. Request Notification Permissions

Add this in your mechanic app after login:

```dart
FirebaseMessaging messaging = FirebaseMessaging.instance;

NotificationSettings settings = await messaging.requestPermission(
  alert: true,
  announcement: false,
  badge: true,
  carPlay: false,
  criticalAlert: false,
  provisional: false,
  sound: true,
);

if (settings.authorizationStatus == AuthorizationStatus.authorized) {
  print('User granted permission');
}
```

### 9. Get FCM Token

```dart
String? token = await FirebaseMessaging.instance.getToken();
print('FCM Token: $token');
// Send this token to your backend API
```

### 10. Handle Notifications

```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('Got a message whilst in the foreground!');
  print('Message data: ${message.data}');

  // Show notification in app
  if (message.notification != null) {
    print('Message also contained a notification: ${message.notification}');
  }
});

FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  print('A new onMessageOpenedApp event was published!');
});
```

## Testing

### Send Test Notification

Use Firebase Console to send a test notification:
1. Go to Cloud Messaging in Firebase Console
2. Click "Send your first message"
3. Enter your FCM token
4. Send notification

### Backend Testing

The backend can send notifications using:

```typescript
import firebaseAdmin from 'firebase-admin';

await firebaseAdmin.messaging().send({
  token: user.fcmToken,
  notification: {
    title: 'New Assignment',
    body: 'You have been assigned to a new booking',
  },
  data: {
    bookingId: '123',
    type: 'assignment',
  },
});
```

## Troubleshooting

### Notifications Not Received
- Check that FCM token is valid
- Verify app is in background or killed
- Check notification permissions are granted
- Test with Firebase Console first

### Build Errors
- Ensure `google-services.json` is in correct location
- Check that Gradle dependencies are correct
- Run `flutter clean` and `flutter pub get`

### Backend Errors
- Verify Firebase credentials in `.env`
- Check that Firebase Admin SDK is initialized
- Ensure project ID matches Firebase Console

## Security Notes

- **NEVER** commit `google-services.json` or `GoogleService-Info.plist` to version control
- Add these files to `.gitignore`
- Keep Firebase private keys secure
- Use environment variables for all sensitive data

## Communication

For any issues with Firebase setup:
- Contact via phone: +967-XXX-XXXXXXX
- Contact via WhatsApp: +967-XXX-XXXXXXX
- **NO EMAILS**

## Next Steps

After completing Firebase setup:
1. Test notifications with Firebase Console
2. Integrate with backend user management
3. Add FCM token to user profile
4. Implement notification types (assignments, status changes, etc.)
5. Add notification preferences in app settings

## Phase 5 Integration

For Phase 5, we will:
- Implement notification service in backend
- Add notification types for different events
- Create notification preferences UI
- Add notification history
- Implement notification scheduling
