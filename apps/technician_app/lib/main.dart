import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'screens/login_screen.dart';
import 'providers/auth_provider.dart';
import 'providers/tasks_provider.dart';
import 'notifications/notifications_provider.dart';
import 'offline/local_db.dart';
import 'offline/sync_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await LocalDB.init();
  
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    // TODO: Log error to crash reporting service
  };

  runZonedGuarded(
    () => runApp(TechnicianApp()),
    (error, stack) {
      // TODO: Log error to crash reporting service
    },
  );
}

class TechnicianApp extends StatefulWidget {
  const TechnicianApp({super.key});

  @override
  State<TechnicianApp> createState() => _TechnicianAppState();
}

class _TechnicianAppState extends State<TechnicianApp> {
  @override
  void initState() {
    super.initState();
    _initConnectivityListener();
    SyncService.startAutoSyncTimer();
  }

  void _initConnectivityListener() {
    Connectivity().onConnectivityChanged.listen((ConnectivityResult result) {
      if (result != ConnectivityResult.none) {
        SyncService.syncAll();
      }
    });
  }

  @override
  void dispose() {
    SyncService.stopAutoSyncTimer();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => TasksProvider()),
        ChangeNotifierProvider(create: (_) => NotificationsProvider()),
      ],
      child: MaterialApp(
        title: 'Technician App',
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark().copyWith(
          primaryColor: Colors.blueAccent,
          scaffoldBackgroundColor: const Color(0xFF121212),
          cardColor: const Color(0xFF1E1E1E),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: const Color(0xFF2C2C2C),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.blueAccent, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
          cardTheme: CardThemeData(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        home: LoginScreen(),
      ),
    );
  }
}
