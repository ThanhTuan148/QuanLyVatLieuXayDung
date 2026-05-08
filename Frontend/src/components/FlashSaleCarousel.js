import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import flashSaleService from '../services/flashSaleService';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

function FlashSaleCarousel() {
  const [activeSales, setActiveSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchActiveSales();
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (activeSales.length || 1));
    }, 5000); // Change every 5 seconds
    return () => clearInterval(interval);
  }, [activeSales.length]);

  const fetchActiveSales = async () => {
    try {
      setLoading(true);
      const data = await flashSaleService.getActiveSales();
      setActiveSales(data || []);
    } catch (err) {
      console.error('Failed to fetch flash sales:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || activeSales.length === 0) {
    return null; // Don't show carousel if no active sales
  }

  const currentSale = activeSales[currentIndex];

  return (
    <Card sx={{ mb: 4, position: 'relative', overflow: 'hidden', bgcolor: '#fff3cd' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <LocalOfferIcon sx={{ fontSize: 32, color: '#ff6b6b' }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ff6b6b' }}>
            ⚡ FLASH SALE - Limited Time!
          </Typography>
        </Box>

        {currentSale && (
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {currentSale.title}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {currentSale.description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip
                label={`Sale ends in: ${getTimeRemaining(currentSale.endTime)}`}
                color="error"
                variant="outlined"
              />
            </Box>

            <Stack direction="row" spacing={1}>
              {currentIndex > 0 && (
                <Button size="small" onClick={() => setCurrentIndex(currentIndex - 1)}>
                  ← Previous
                </Button>
              )}
              {currentIndex < activeSales.length - 1 && (
                <Button size="small" onClick={() => setCurrentIndex(currentIndex + 1)}>
                  Next →
                </Button>
              )}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function getTimeRemaining(endTime) {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

export default FlashSaleCarousel;
