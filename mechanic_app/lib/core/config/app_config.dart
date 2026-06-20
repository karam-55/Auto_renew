import 'package:flutter/foundation.dart';

class AppConfig {
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:8080/api';
    }
    // For mobile/desktop: use environment variable or default
    // The user can configure this in settings screen
    return _serverUrl;
  }

  static String _serverUrl = 'http://localhost:8080/api';

  static set serverUrl(String url) {
    _serverUrl = url.endsWith('/api') ? url : '$url/api';
  }

  static String get serverUrl => _serverUrl;
}
