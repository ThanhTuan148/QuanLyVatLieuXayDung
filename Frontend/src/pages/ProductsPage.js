import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CategoryIcon from '@mui/icons-material/Category';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ProductsTab from '../components/ProductsTab';
import CategoriesTab from '../components/CategoriesTab';
import { usePermissions } from '../contexts/PermissionContext';

function ProductsPage() {
  const { permissions } = usePermissions();
  const [activeTab, setActiveTab] = useState(0);

  // Define tabs with their corresponding module keys
  const allTabs = [
    { label: "Sản Phẩm", icon: <Inventory2Icon />, moduleKey: 'products', component: <ProductsTab /> },
    { label: "Sản Phẩm Quà Tặng", icon: <CardGiftcardIcon />, moduleKey: 'products', component: <ProductsTab showGiftsOnly={true} /> },
    { label: "Loại Sản Phẩm (Danh Mục)", icon: <CategoryIcon />, moduleKey: 'categories', component: <CategoriesTab /> }
  ];

  // Filter tabs based on view permission
  const visibleTabs = allTabs.filter(tab => !tab.moduleKey || permissions?.[tab.moduleKey]?.coTheXem);

  useEffect(() => {
    // If the currently selected tab index is no longer valid for visibleTabs, reset to 0
    if (activeTab >= visibleTabs.length) {
      setActiveTab(0);
    }
  }, [visibleTabs.length, activeTab]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (visibleTabs.length === 0) return null;

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
          {visibleTabs.map((tab, index) => (
            <Tab 
              key={index}
              icon={tab.icon} 
              iconPosition="start" 
              label={tab.label} 
              sx={{ fontWeight: 'bold', textTransform: 'none', fontSize: '1.05rem' }} 
            />
          ))}
        </Tabs>

        {visibleTabs[activeTab]?.component}
      </Paper>
    </Box>
  );
}

export default ProductsPage;
