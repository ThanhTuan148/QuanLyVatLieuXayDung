import storageHelper from './storageHelper';

// Helper to notify other components (like Header) about cart changes
const notifyCartUpdate = () => {
  window.dispatchEvent(new CustomEvent('cart-updated'));
};

// Using localStorage as the backend Cart controller does not exist yet.
const cartService = {
  async getUserCart() {
    const userId = storageHelper.getUserId();
    const saved = localStorage.getItem(`cart_${userId}`);
    return saved ? JSON.parse(saved) : [];
  },

  async addToCart(cart) {
    const userId = storageHelper.getUserId();
    const existing = await this.getUserCart();
    
    // Check if product already in cart
    const existingIndex = existing.findIndex(item => item.productId === cart.productId);
    if (existingIndex >= 0) {
      existing[existingIndex].quantity += (cart.quantity || 1);
    } else {
      existing.push({
        ...cart,
        cartId: Date.now().toString() + Math.random().toString()
      });
    }
    
    localStorage.setItem(`cart_${userId}`, JSON.stringify(existing));
    notifyCartUpdate();
    return cart;
  },

  async updateCartItem(id, data) {
    const userId = storageHelper.getUserId();
    const existing = await this.getUserCart();
    const index = existing.findIndex(item => item.cartId === id);
    if (index >= 0) {
      existing[index] = { ...existing[index], ...data };
      localStorage.setItem(`cart_${userId}`, JSON.stringify(existing));
      notifyCartUpdate();
    }
    return existing[index];
  },

  async removeFromCart(id) {
    const userId = storageHelper.getUserId();
    let existing = await this.getUserCart();
    existing = existing.filter(item => item.cartId !== id);
    localStorage.setItem(`cart_${userId}`, JSON.stringify(existing));
    notifyCartUpdate();
    return true;
  },

  async clearUserCart() {
    const userId = storageHelper.getUserId();
    localStorage.removeItem(`cart_${userId}`);
    notifyCartUpdate();
    return true;
  }
}

export default cartService;
