import React from 'react';
import { DataGrid, GridToolbar, viVN, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarExport, GridToolbarQuickFilter } from '@mui/x-data-grid';
import { Box, Paper, useTheme, alpha, TextField, Stack, Typography } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

/**
 * DataTable Component
 * @param {Array} rows - Dữ liệu hiển thị (phải có id duy nhất cho mỗi dòng)
 * @param {Array} columns - Cấu hình các cột
 * @param {Function} getRowId - Hàm lấy ID duy nhất (mặc định là row.id)
 * @param {Boolean} loading - Trạng thái đang tải
 * @param {Object} sx - Style bổ sung cho container
 */
const DataTable = ({ 
  rows = [], 
  columns = [], 
  getRowId, 
  loading = false, 
  pageSize = 10,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  sx = {},
  dateField = 'ngayTao', // Mặc định lọc theo ngayTao nếu không chỉ định
  showDateFilter = true,
  ...props 
}) => {
  const theme = useTheme();
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  // Lọc dữ liệu theo khoảng thời gian
  const filteredRows = React.useMemo(() => {
    if (!startDate && !endDate) return rows;
    
    // Tìm field ngày thực tế trong row (nếu dateField mặc định không có)
    const getActualDateField = (row) => {
      if (row[dateField]) return dateField;
      if (row['ngayLap']) return 'ngayLap';
      if (row['ngayGiao']) return 'ngayGiao';
      if (row['ngayTT']) return 'ngayTT';
      if (row['ngayHen']) return 'ngayHen';
      return null;
    };

    return rows.filter(row => {
      const field = getActualDateField(row);
      if (!field) return true;

      const dateVal = new Date(row[field]);
      if (isNaN(dateVal.getTime())) return true;

      // Chuẩn hóa ngày để so sánh (không lấy giờ)
      const d = new Date(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate());

      if (startDate && !endDate) {
        // Chỉ chọn Từ ngày -> Lọc chính xác ngày đó
        const start = new Date(startDate);
        const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        return d.getTime() === s.getTime();
      }

      if (startDate && endDate) {
        // Chọn cả hai -> Lọc theo khoảng
        const start = new Date(startDate);
        const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const end = new Date(endDate);
        const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        return d >= s && d <= e;
      }

      if (!startDate && endDate) {
        // Chỉ chọn Đến ngày -> Lọc tất cả trước ngày đó
        const end = new Date(endDate);
        const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        return d <= e;
      }

      return true;
    });
  }, [rows, startDate, endDate, dateField]);

  const CustomToolbar = () => {
    return (
      <GridToolbarContainer sx={{ p: 1.5, gap: 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
          <GridToolbarExport csvOptions={{ utf8WithBom: true }} />
        </Box>

        {showDateFilter && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto', bgcolor: alpha(theme.palette.primary.main, 0.03), p: 1, borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
            <CalendarTodayIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, ml: 0.5 }} />
            <Typography variant="caption" fontWeight="bold" sx={{ color: theme.palette.text.secondary, mr: 1 }}>Khoảng thời gian:</Typography>
            <TextField
              type="date"
              size="small"
              label="Từ ngày"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={{ width: 150, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            <TextField
              type="date"
              size="small"
              label="Đến ngày"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{ width: 150, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
            />
            {(startDate || endDate) && (
              <Typography 
                variant="caption" 
                sx={{ cursor: 'pointer', color: theme.palette.primary.main, fontWeight: 'bold', px: 1 }}
                onClick={() => { setStartDate(''); setEndDate(''); }}
              >
                Xóa lọc
              </Typography>
            )}
          </Stack>
        )}
        
        <Box sx={{ width: '100%', mt: 0.5 }}>
          <GridToolbarQuickFilter 
            debounceMs={500} 
            placeholder="Tìm kiếm nhanh..."
            sx={{ 
              width: '100%',
              '& .MuiInputBase-root': {
                bgcolor: alpha(theme.palette.common.white, 0.8),
                borderRadius: 2,
                px: 2
              }
            }} 
          />
        </Box>
      </GridToolbarContainer>
    );
  };

  return (
    <Box sx={{ 
      height: 600, 
      width: '100%', 
      position: 'relative',
      zIndex: 1, // Đảm bảo các panel filter nổi lên trên
      '& .MuiDataGrid-root': {
        border: 'none',
        borderRadius: 2,
      },
      '& .MuiDataGrid-columnHeaders': {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        borderBottom: `1px solid ${theme.palette.divider}`,
        fontWeight: 'bold',
      },
      '& .MuiDataGrid-cell': {
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      },
      '& .MuiDataGrid-footerContainer': {
        borderTop: `1px solid ${theme.palette.divider}`,
      },
      ...sx 
    }}>
      <Paper elevation={0} sx={{ height: '100%', borderRadius: 2, overflow: 'visible', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          getRowId={getRowId || ((row) => row.id)}
          initialState={{
            pagination: {
              paginationModel: { pageSize: pageSize, page: 0 },
            },
          }}
          pageSizeOptions={rowsPerPageOptions}
          slots={{ 
            toolbar: CustomToolbar 
          }}
          disableRowSelectionOnClick
          localeText={viVN.components.MuiDataGrid.defaultProps.localeText}
          sx={{
            '& .MuiDataGrid-toolbarContainer': {
              p: 1.5,
              gap: 1,
              '& .MuiButton-root': {
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
              }
            }
          }}
          {...props}
        />
      </Paper>
    </Box>
  );
};

export default DataTable;
