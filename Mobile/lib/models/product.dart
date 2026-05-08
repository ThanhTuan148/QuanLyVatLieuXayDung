// lib/models/product.dart
class Product {
  final int productId;
  final String productName;
  final String sku;
  final int categoryId;
  final String categoryName;
  final String description;
  final String unit;
  final double unitPrice;
  final double? costPrice;
  final int reorderLevel;
  final bool isActive;

  Product({
    required this.productId,
    required this.productName,
    required this.sku,
    required this.categoryId,
    required this.categoryName,
    required this.description,
    required this.unit,
    required this.unitPrice,
    this.costPrice,
    required this.reorderLevel,
    required this.isActive,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      productId: json['productId'],
      productName: json['productName'],
      sku: json['sku'],
      categoryId: json['categoryId'],
      categoryName: json['categoryName'],
      description: json['description'],
      unit: json['unit'],
      unitPrice: (json['unitPrice'] as num).toDouble(),
      costPrice: json['costPrice'] != null ? (json['costPrice'] as num).toDouble() : null,
      reorderLevel: json['reorderLevel'],
      isActive: json['isActive'],
    );
  }
}
