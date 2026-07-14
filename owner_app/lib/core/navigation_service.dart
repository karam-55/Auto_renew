import 'package:flutter/material.dart';

class NavigationService {
  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  static Future<void> navigateToAndRemoveUntil(
    Widget page,
    RoutePredicate predicate,
  ) async {
    final state = navigatorKey.currentState;
    if (state == null) return;
    state.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => page),
      predicate,
    );
  }
}
