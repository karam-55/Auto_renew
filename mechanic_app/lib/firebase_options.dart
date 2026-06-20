// Firebase Configuration Options
// 
// This file is a placeholder for Firebase Cloud Messaging (FCM) configuration.
// FCM is optional for Phase 5 and can be implemented later.
//
// SETUP INSTRUCTIONS:
// 1. Create a Firebase project at https://console.firebase.google.com/
// 2. Add Android app with package name: com.garagego.mechanic
// 3. Download google-services.json and place in android/app/
// 4. Add iOS app if needed (bundle ID: com.garagego.mechanic)
// 5. Download GoogleService-Info.plist and place in ios/Runner/
// 6. Enable Cloud Messaging in Firebase Console
// 7. Copy FCM credentials to backend/.env
//
// DETAILED GUIDE: See docs/FIREBASE_SETUP.md
//
// IMPORTANT: NO EMAILS - Use phone/WhatsApp for all communication
//
// Phase 5: FCM is optional, can be implemented later
// Phase 6: Full notification system with WhatsApp integration

// TODO: Replace this with actual Firebase options when setting up FCM
// Run: flutterfire configure
// Or manually add options from Firebase Console

// import 'package:firebase_core/firebase_core.dart';

// const firebaseOptions = FirebaseOptions(
//   apiKey: 'YOUR_API_KEY',
//   appId: 'YOUR_APP_ID',
//   messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
//   projectId: 'YOUR_PROJECT_ID',
//   // ... other options
// );

// Default placeholder - will be replaced during actual Firebase setup
class FirebaseOptions {
  const FirebaseOptions({
    this.apiKey,
    this.appId,
    this.messagingSenderId,
    this.projectId,
  });

  final String? apiKey;
  final String? appId;
  final String? messagingSenderId;
  final String? projectId;
}
