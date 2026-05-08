// src/services/storageHelper.js
import authService from './authService';

const storageHelper = {
  getUserId() {
    const user = authService.getUser();
    if (user && (user.id || user.maKhachHang || user.MaKhachHang)) {
      return user.maKhachHang || user.MaKhachHang || user.id;
    }
    return 'guest';
  },

  getCartKey() {
    return 'cart_' + this.getUserId();
  },

  getFavoritesKey() {
    return 'favorites_' + this.getUserId();
  },

  // Initialize or fetch favorites
  getFavorites() {
    return JSON.parse(localStorage.getItem(this.getFavoritesKey()) || '[]');
  },

  // Save favorites
  saveFavorites(favoritesArray) {
    localStorage.setItem(this.getFavoritesKey(), JSON.stringify(favoritesArray));
  },

  // Merge guest data to logged-in user data
  mergeGuestData(userId) {
    // 1. Merge Favorites
    const guestFavs = JSON.parse(localStorage.getItem('favorites_guest') || '[]');
    const userFavsKey = 'favorites_' + userId;
    let userFavs = JSON.parse(localStorage.getItem(userFavsKey) || '[]');
    
    if (guestFavs.length > 0) {
      guestFavs.forEach(guestProd => {
        const guestId = typeof guestProd === 'object' ? (guestProd.maSanPham || guestProd.maSP) : guestProd;
        if (guestId) {
          const exists = userFavs.some(f => (typeof f === 'object' ? (f.maSanPham || f.maSP) : f) === guestId);
          if (!exists) {
            userFavs.push(guestId); // Force pushing only IDs to maintain standard
          }
        }
      });
      // Filter out any old objects in userFavs to maintain consistency
      userFavs = userFavs.map(f => typeof f === 'object' ? (f.maSanPham || f.maSP) : f).filter(Boolean);
      localStorage.setItem(userFavsKey, JSON.stringify(userFavs));
      localStorage.removeItem('favorites_guest'); // clear guest favorites
    }

    // 2. Merge Cart
    const guestCart = JSON.parse(localStorage.getItem('cart_guest') || '[]');
    const userCartKey = 'cart_' + userId;
    let userCart = JSON.parse(localStorage.getItem(userCartKey) || '[]');
    
    if (guestCart.length > 0) {
      guestCart.forEach(gItem => {
        const existingIndex = userCart.findIndex(uItem => uItem.productId === gItem.productId);
        if (existingIndex >= 0) {
          userCart[existingIndex].quantity += gItem.quantity;
        } else {
          userCart.push({...gItem, cartId: Date.now().toString() + Math.random().toString()});
        }
      });
      localStorage.setItem(userCartKey, JSON.stringify(userCart));
      localStorage.removeItem('cart_guest'); // clear guest cart
    }
  },

  clearGuestData() {
    localStorage.removeItem('cart_guest');
    localStorage.removeItem('favorites_guest');
    // Clear any other guest specific keys if added later
  }
};

export default storageHelper;
