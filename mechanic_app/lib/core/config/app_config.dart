class AppConfig {
  /// Server URL configured at build time via --dart-define=SERVER_URL=...
  /// Default is localhost for development. Never hardcode production IPs in source.
  static const String _defaultServerUrl = 'http://localhost:8080';
  static const String _buildTimeServerUrl = String.fromEnvironment(
    'SERVER_URL',
    defaultValue: _defaultServerUrl,
  );

  static String _serverUrl = _buildTimeServerUrl;

  static set serverUrl(String url) {
    _serverUrl = url.replaceAll(RegExp(r'/+$'), '');
  }

  static String get baseUrl {
    return '$_serverUrl/api';
  }

  static String get serverUrl => _serverUrl;
}
