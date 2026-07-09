import 'package:flutter/material.dart';

/// Global keys for app-wide access to Navigator and ScaffoldMessenger
/// without passing BuildContext across async gaps.
class AppKeys {
  static final GlobalKey<ScaffoldMessengerState> scaffoldMessengerKey =
      GlobalKey<ScaffoldMessengerState>();
}
