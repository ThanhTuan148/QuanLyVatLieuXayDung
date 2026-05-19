// lib/core/app_image.dart
// Widget hiển thị ảnh từ URL server — dùng chung toàn app
import 'package:flutter/material.dart';
import '../services/shared_preferences_service.dart';

class AppImage extends StatelessWidget {
  /// Nhận vào relative path (vd: '/images/products/abc.jpg')
  /// hoặc full URL (vd: 'http://...')
  final String? imagePath;

  /// Kích thước ảnh (mặc định 48x48)
  final double width;
  final double height;

  /// Fit của ảnh
  final BoxFit fit;

  /// Border radius
  final double borderRadius;

  /// Icon fallback khi không có ảnh
  final IconData fallbackIcon;

  /// Màu icon fallback
  final Color? fallbackIconColor;

  const AppImage({
    super.key,
    this.imagePath,
    this.width = 48,
    this.height = 48,
    this.fit = BoxFit.cover,
    this.borderRadius = 6,
    this.fallbackIcon = Icons.image_outlined,
    this.fallbackIconColor,
  });

  @override
  Widget build(BuildContext context) {
    final imgUrl = SharedPreferencesService.getImageUrl(imagePath);

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: imgUrl.isNotEmpty
          ? Image.network(
              imgUrl,
              width: width,
              height: height,
              fit: fit,
              loadingBuilder: (ctx, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return _placeholder(
                  child: Center(
                    child: CircularProgressIndicator(
                      value: loadingProgress.expectedTotalBytes != null
                          ? loadingProgress.cumulativeBytesLoaded /
                              loadingProgress.expectedTotalBytes!
                          : null,
                      strokeWidth: 2,
                      color: Colors.grey,
                    ),
                  ),
                );
              },
              errorBuilder: (ctx, error, stack) => _placeholder(
                child: Icon(
                  Icons.broken_image_outlined,
                  color: Colors.grey.shade400,
                  size: width * 0.5,
                ),
              ),
            )
          : _placeholder(
              child: Icon(
                fallbackIcon,
                color: fallbackIconColor ?? Colors.grey.shade400,
                size: width * 0.5,
              ),
            ),
    );
  }

  Widget _placeholder({required Widget child}) {
    return Container(
      width: width,
      height: height,
      color: Colors.grey.shade100,
      child: child,
    );
  }
}
