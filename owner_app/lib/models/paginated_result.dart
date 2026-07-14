class PaginatedResult<T> {
  final List<T> data;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  const PaginatedResult({
    required this.data,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory PaginatedResult.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    final rawData = json['data'];
    final List items = rawData is List ? rawData : [];
    return PaginatedResult(
      data: items.map((e) => fromJson(e as Map<String, dynamic>)).toList(),
      total: _parseInt(json['total']),
      page: _parseInt(json['page'], defaultValue: 1),
      limit: _parseInt(json['limit'], defaultValue: 20),
      totalPages: _parseInt(json['totalPages'], defaultValue: 1),
    );
  }

  bool get hasMore => page < totalPages;

  static int _parseInt(dynamic value, {int defaultValue = 0}) {
    if (value == null) return defaultValue;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? defaultValue;
    return defaultValue;
  }
}
