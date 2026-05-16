import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  InfoOutlined as InfoIcon,
  ConfirmationNumberOutlined as VoucherIcon,
} from '@mui/icons-material';

const CouponsModal = ({ open, onClose, coupons, onApply, currentTotal, appliedCode, onApplyManual }) => {
  const [manualCode, setManualCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleManualApply = async () => {
    if (!manualCode.trim() || !onApplyManual) return;
    setLoading(true);
    try {
      await onApplyManual(manualCode);
      setManualCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper" PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VoucherIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>CHỌN ƯU ĐÃI HỆ THỐNG</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <TextField 
            fullWidth size="small" placeholder="Nhập mã Coupon / Gift Card" 
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            disabled={loading}
            sx={{ 
              '& .MuiOutlinedInput-root': { borderRadius: '8px', height: '40px' } 
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleManualApply}
            disabled={loading || !manualCode.trim()}
            sx={{ 
              borderRadius: '8px', px: 3, height: '40px', bgcolor: '#e68c55', 
              '&:hover': { bgcolor: '#cc7a4a' },
              whiteSpace: 'nowrap', minWidth: '100px'
            }}
          >
            {loading ? '...' : 'Áp dụng'}
          </Button>
        </Box>

        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Danh sách ưu đãi hệ thống</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {coupons.length > 0 ? coupons.map((cp) => {
            const isEligible = currentTotal >= (cp.donHangToiThieu || 0);
            return (
              <Grid item xs={12} key={cp.maKhuyenMai}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    display: 'flex', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden',
                    opacity: isEligible ? 1 : 0.6
                  }}
                >
                  {/* Left Ticket Part */}
                  <Box sx={{ 
                    width: 100, bgcolor: cp.loaiGiamGia === 'Freeship' ? '#e8f5e9' : (isEligible ? '#fff5f0' : '#f5f5f5'), 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderRight: '1px dashed #ddd', position: 'relative'
                  }}>
                    <Box sx={{ position: 'absolute', top: -10, left: 95, width: 20, height: 20, bgcolor: '#fff', borderRadius: '50%' }} />
                    <Box sx={{ position: 'absolute', bottom: -10, left: 95, width: 20, height: 20, bgcolor: '#fff', borderRadius: '50%' }} />
                    
                    <Box sx={{ 
                      width: 50, height: 50, borderRadius: '50%', bgcolor: '#fff', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      {cp.loaiGiamGia === 'Freeship' ? (
                        <VoucherIcon sx={{ fontSize: 24, color: '#4caf50' }} />
                      ) : (
                        <Typography fontSize={24} color={isEligible ? '#e68c55' : '#aaa'}>%</Typography>
                      )}
                    </Box>
                    <Typography fontSize={10} color="text.secondary" fontWeight={600}>
                      {cp.loaiGiamGia === 'Freeship' ? 'Freeship' : 'Mã giảm'}
                    </Typography>
                  </Box>

                  {/* Right Info Part */}
                  <Box sx={{ flexGrow: 1, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ pr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {cp.loaiGiamGia === 'PhanTram' ? `Giảm ${cp.giaTriGiam}%` : `Giảm ₫${cp.giaTriGiam.toLocaleString('vi-VN')}`} - Toàn Sàn
                        </Typography>
                        <InfoIcon sx={{ fontSize: 16, color: '#1976d2', cursor: 'pointer' }} />
                      </Box>
                      <Typography fontSize={11} color="text.secondary" sx={{ mb: 0.5 }}>
                        Đơn hàng từ ₫{(cp.donHangToiThieu || 0).toLocaleString('vi-VN')}
                      </Typography>
                      <Typography fontSize={11} sx={{ color: cp.loaiGiamGia === 'Freeship' ? '#4caf50' : '#e68c55', fontWeight: 600 }}>
                        HSD: {new Date(cp.thoiGianKetThuc).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                    <Button 
                      variant={cp.maApDung === appliedCode ? 'outlined' : 'contained'} 
                      onClick={() => onApply(cp)}
                      disabled={!isEligible}
                      sx={{ 
                        borderRadius: '8px', fontSize: '0.8rem', textTransform: 'none', px: 2,
                        minWidth: '95px',
                        borderColor: cp.maApDung === appliedCode ? (cp.loaiGiamGia === 'Freeship' ? '#4caf50' : '#e68c55') : 'transparent',
                        color: cp.maApDung === appliedCode ? (cp.loaiGiamGia === 'Freeship' ? '#4caf50' : '#e68c55') : '#fff',
                        bgcolor: cp.maApDung === appliedCode ? 'transparent' : (cp.loaiGiamGia === 'Freeship' ? '#4caf50' : '#e68c55'), 
                        '&:hover': { 
                          bgcolor: cp.maApDung === appliedCode ? 'rgba(0,0,0,0.02)' : (cp.loaiGiamGia === 'Freeship' ? '#388e3c' : '#cc7a4a'),
                          borderColor: cp.maApDung === appliedCode ? (cp.loaiGiamGia === 'Freeship' ? '#388e3c' : '#cc7a4a') : 'transparent',
                        }
                      }}
                    >
                      {cp.maApDung === appliedCode ? 'Đã áp dụng' : 'Áp dụng'}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          }) : (
            <Grid item xs={12}>
              <Typography align="center" color="text.secondary" sx={{ py: 3 }}>Chưa có mã giảm giá nào phù hợp</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default CouponsModal;
