// lib/models/user.dart
class User {
  final int userId;
  final String username;
  final String email;
  final String fullName;
  final String? phoneNumber;
  final String? address;
  final int roleId;
  final String roleName;
  final bool isActive;

  User({
    required this.userId,
    required this.username,
    required this.email,
    required this.fullName,
    this.phoneNumber,
    this.address,
    required this.roleId,
    required this.roleName,
    required this.isActive,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      userId: json['userId'],
      username: json['username'],
      email: json['email'],
      fullName: json['fullName'],
      phoneNumber: json['phoneNumber'],
      address: json['address'],
      roleId: json['roleId'],
      roleName: json['roleName'],
      isActive: json['isActive'],
    );
  }
}
