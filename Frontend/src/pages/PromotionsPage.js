import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import ProductPromotionsTab from '../components/ProductPromotionsTab';
import FlashSalesTab from '../components/FlashSalesTab';
import CouponTab from '../components/CouponTab';
import UuDaiTab from '../components/UuDaiTab';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PromotionsPage() {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

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
          <Tab icon={<LocalOfferIcon />} label="Khuyến mãi sản phẩm" iconPosition="start" />
          <Tab icon={<FlashOnIcon />} label="Flash Sales" iconPosition="start" />
          <Tab icon={<CardGiftcardIcon />} label="Ưu đãi hệ thống" iconPosition="start" />
          <Tab icon={<ConfirmationNumberIcon />} label="Coupon (Nhập mã)" iconPosition="start" />
        </Tabs>

        <Box sx={{ px: 3 }}>
          <TabPanel value={tabIndex} index={0}>
            <ProductPromotionsTab />
          </TabPanel>
          <TabPanel value={tabIndex} index={1}>
            <FlashSalesTab />
          </TabPanel>
          <TabPanel value={tabIndex} index={2}>
            <UuDaiTab />
          </TabPanel>
          <TabPanel value={tabIndex} index={3}>
            <CouponTab />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
