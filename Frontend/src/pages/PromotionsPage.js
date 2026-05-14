import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import ProductPromotionsTab from '../components/ProductPromotionsTab';
import FlashSalesTab from '../components/FlashSalesTab';
import CouponTab from '../components/CouponTab';
import UuDaiTab from '../components/UuDaiTab';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { usePermissions } from '../contexts/PermissionContext';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PromotionsPage() {
  const { permissions } = usePermissions();
  const [tabIndex, setTabIndex] = useState(0);

  const allTabs = [
    { label: "Khuyến mãi sản phẩm", icon: <LocalOfferIcon />, moduleKey: 'promotions', component: <ProductPromotionsTab /> },
    { label: "Flash Sales", icon: <FlashOnIcon />, moduleKey: 'flashsales', component: <FlashSalesTab /> },
    { label: "Ưu đãi hệ thống", icon: <CardGiftcardIcon />, moduleKey: 'promotions', component: <UuDaiTab /> },
    { label: "Coupon (Nhập mã)", icon: <ConfirmationNumberIcon />, moduleKey: 'promotions', component: <CouponTab /> }
  ];

  const visibleTabs = allTabs.filter(tab => !tab.moduleKey || permissions?.[tab.moduleKey]?.coTheXem);

  useEffect(() => {
    if (tabIndex >= visibleTabs.length) {
      setTabIndex(0);
    }
  }, [visibleTabs.length, tabIndex]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  if (visibleTabs.length === 0) return null;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>📢 Quản Lý Chương Trình Ưu Đãi</Typography>
        <Typography variant="body2" color="textSecondary">
          Quản lý tập trung Khuyến mãi sản phẩm, Flash Sales, Ưu đãi hệ thống và Coupon
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {visibleTabs.map((tab, index) => (
            <Tab 
              key={index} 
              icon={tab.icon} 
              label={tab.label} 
              iconPosition="start" 
            />
          ))}
        </Tabs>

        <Box sx={{ px: 3 }}>
          {visibleTabs.map((tab, index) => (
            <TabPanel key={index} value={tabIndex} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
