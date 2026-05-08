import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CategoryIcon from '@mui/icons-material/Category';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ProductsTab from '../components/ProductsTab';
import CategoriesTab from '../components/CategoriesTab';

function ProductsPage() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>📦 Kho Sản Phẩm & Danh Mục</Typography>
        <Typography variant="body2" color="textSecondary">Quản lý toàn bộ danh sách sản phẩm và phân loại</Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 2, background: 'transparent' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          indicatorColor="primary" 
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab 
            icon={<Inventory2Icon />} 
            iconPosition="start" 
            label="Sản Phẩm" 
            sx={{ fontWeight: 'bold', textTransform: 'none', fontSize: '1.05rem' }} 
          />
          <Tab 
            icon={<CardGiftcardIcon />} 
            iconPosition="start" 
            label="Sản Phẩm Quà Tặng" 
            sx={{ fontWeight: 'bold', textTransform: 'none', fontSize: '1.05rem' }} 
          />
          <Tab 
            icon={<CategoryIcon />} 
            iconPosition="start" 
            label="Loại Sản Phẩm (Danh Mục)" 
            sx={{ fontWeight: 'bold', textTransform: 'none', fontSize: '1.05rem' }} 
          />
        </Tabs>

        {activeTab === 0 && <ProductsTab />}
        {activeTab === 1 && <ProductsTab showGiftsOnly={true} />}
        {activeTab === 2 && <CategoriesTab />}
      </Paper>
    </Box>
  );
}

export default ProductsPage;
