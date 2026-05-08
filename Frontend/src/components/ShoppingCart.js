import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import cartService from '../services/cartService';

function ShoppingCart() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await cartService.getUserCart();
      setCartItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (cartId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const item = cartItems.find(i => i.cartId === cartId);
      await cartService.updateCartItem(cartId, {
        ...item,
        quantity: newQuantity
      });
      fetchCart();
    } catch (err) {
      console.error('Failed to update cart item:', err);
      alert('Update failed');
    }
  };

  const handleRemoveItem = async (cartId) => {
    if (!window.confirm('Remove this item from cart?')) return;
    try {
      await cartService.removeFromCart(cartId);
      fetchCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
      alert('Remove failed');
    }
  };

  const handleCheckout = () => {
    alert(`Checkout with ${cartItems.length} items - Total: $${total.toFixed(2)}`);
    // Implement checkout logic here
  };

  if (loading) return <Typography>Loading cart...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Shopping Cart ({cartItems.length} items)
      </Typography>

      {cartItems.length === 0 ? (
        <Typography color="textSecondary">Your cart is empty</Typography>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.cartId}>
                    <TableCell>{item.product?.productName || 'Unknown'}</TableCell>
                    <TableCell align="right">${item.price?.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.cartId, parseInt(e.target.value))
                        }
                        inputProps={{ min: 1 }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${(item.quantity * item.price)?.toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveItem(item.cartId)}
                        startIcon={<DeleteIcon />}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Total: <strong>${total.toFixed(2)}</strong>
            </Typography>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

export default ShoppingCart;
