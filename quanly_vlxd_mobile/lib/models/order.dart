// lib/models/order.dart
class SalesOrder {
  final int orderId;
  final String orderCode;
  final int customerId;
  final String customerName;
  final DateTime orderDate;
  final DateTime? deliveryDate;
  final String status;
  final double? totalAmount;
  final double discount;
  final double? finalAmount;
  final String? notes;

  SalesOrder({
    required this.orderId,
    required this.orderCode,
    required this.customerId,
    required this.customerName,
    required this.orderDate,
    this.deliveryDate,
    required this.status,
    this.totalAmount,
    required this.discount,
    this.finalAmount,
    this.notes,
  });

  factory SalesOrder.fromJson(Map<String, dynamic> json) {
    return SalesOrder(
      orderId: json['orderId'],
      orderCode: json['orderCode'],
      customerId: json['customerId'],
      customerName: json['customerName'],
      orderDate: DateTime.parse(json['orderDate']),
      deliveryDate: json['deliveryDate'] != null ? DateTime.parse(json['deliveryDate']) : null,
      status: json['status'],
      totalAmount: json['totalAmount'] != null ? (json['totalAmount'] as num).toDouble() : null,
      discount: (json['discount'] as num).toDouble(),
      finalAmount: json['finalAmount'] != null ? (json['finalAmount'] as num).toDouble() : null,
      notes: json['notes'],
    );
  }
}
