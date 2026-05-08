// lib/screens/home_screen.dart
import 'package:flutter/material.dart';
import '../services/shared_preferences_service.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  void _logout() {
    SharedPreferencesService.logout();
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Building Material Store'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory),
            label: 'Inventory',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_shipping),
            label: 'Deliveries',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_cart),
            label: 'Orders',
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0:
        return const DashboardTab();
      case 1:
        return const InventoryTab();
      case 2:
        return const DeliveriesTab();
      case 3:
        return const OrdersTab();
      default:
        return const DashboardTab();
    }
  }
}

class DashboardTab extends StatelessWidget {
  const DashboardTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.dashboard, size: 64, color: Colors.blue),
          const SizedBox(height: 16),
          const Text('Dashboard', style: TextStyle(fontSize: 20)),
          const SizedBox(height: 8),
          const Text('Coming soon...', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}

class InventoryTab extends StatelessWidget {
  const InventoryTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.inventory, size: 64, color: Colors.green),
          const SizedBox(height: 16),
          const Text('Inventory Management', style: TextStyle(fontSize: 20)),
          const SizedBox(height: 8),
          const Text('Track stock levels', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}

class DeliveriesTab extends StatelessWidget {
  const DeliveriesTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.local_shipping, size: 64, color: Colors.orange),
          const SizedBox(height: 16),
          const Text('Deliveries', style: TextStyle(fontSize: 20)),
          const SizedBox(height: 8),
          const Text('Track delivery status', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}

class OrdersTab extends StatelessWidget {
  const OrdersTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.shopping_cart, size: 64, color: Colors.purple),
          const SizedBox(height: 16),
          const Text('Orders', style: TextStyle(fontSize: 20)),
          const SizedBox(height: 8),
          const Text('View recent orders', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}
