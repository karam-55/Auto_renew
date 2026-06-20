import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/notification_item.dart';
import 'notifications_provider.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  Color _getBorderColor(String type) {
    switch (type.toUpperCase()) {
      case 'INFO':
        return Colors.blue;
      case 'WARNING':
        return Colors.orange;
      case 'ERROR':
        return Colors.red;
      case 'SUCCESS':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  IconData _getIcon(String type) {
    switch (type.toUpperCase()) {
      case 'INFO':
        return Icons.info;
      case 'WARNING':
        return Icons.warning;
      case 'ERROR':
        return Icons.error;
      case 'SUCCESS':
        return Icons.check_circle;
      default:
        return Icons.notifications;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الإشعارات')),
      body: Selector<NotificationsProvider, bool>(
        selector: (context, provider) => provider.isLoading,
        builder: (context, isLoading, child) {
          if (isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          return Selector<NotificationsProvider, List<NotificationItem>>(
            selector: (context, provider) => provider.notifications,
            builder: (context, notifications, child) {
              return RefreshIndicator(
                onRefresh: () => context.read<NotificationsProvider>().loadNotifications(),
                child: ListView.builder(
                  padding: const EdgeInsets.all(8),
                  itemCount: notifications.length,
                  itemBuilder: (context, index) {
                    final notification = notifications[index];
                    return Padding(
                      padding: const EdgeInsets.all(8),
                      child: Dismissible(
                        key: ValueKey(notification.id),
                        onDismissed: (direction) {
                          context.read<NotificationsProvider>().markAsRead(notification.id);
                        },
                        background: Container(
                          color: Colors.green,
                          alignment: Alignment.centerLeft,
                          padding: const EdgeInsets.only(left: 20),
                          child: const Icon(Icons.check, color: Colors.white),
                        ),
                        child: Card(
                          elevation: 1,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border(
                                left: BorderSide(
                                  color: _getBorderColor(notification.type),
                                  width: 4,
                                ),
                              ),
                            ),
                            child: ListTile(
                              leading: Icon(_getIcon(notification.type)),
                              title: Text(notification.title),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(notification.message),
                                  const SizedBox(height: 4),
                                  Text(
                                    _formatTimestamp(notification.createdAt),
                                    style: const TextStyle(
                                      color: Colors.grey,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                              trailing: notification.read
                                  ? null
                                  : const Icon(Icons.circle, color: Colors.red, size: 8),
                              onTap: () {
                                context.read<NotificationsProvider>().markAsRead(notification.id);
                              },
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }

  String _formatTimestamp(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'الآن';
    } else if (difference.inMinutes < 60) {
      return 'منذ ${difference.inMinutes} دقيقة';
    } else if (difference.inHours < 24) {
      return 'منذ ${difference.inHours} ساعة';
    } else {
      return 'منذ ${difference.inDays} يوم';
    }
  }
}
