import React from 'react';
import { DataGrid, GridToolbar, viVN } from '@mui/x-data-grid';
import { Box, Paper, useTheme, alpha } from '@mui/material';

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
  ...props 
}) => {
  const theme = useTheme();

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
          rows={rows}
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
            toolbar: GridToolbar 
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
              csvOptions: { utf8WithBom: true },
              printOptions: { disableToolbarButton: true },
            },
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
