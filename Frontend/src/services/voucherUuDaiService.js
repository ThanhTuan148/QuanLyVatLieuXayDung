import api from './api';

const voucherUuDaiService = {
    // Lấy tất cả voucher (loại UuDai)
    getAll: () => api.get('/promotions?loai=UuDai'),
    
    get: (id) => api.get(`/promotions/${id}`),
    
    create: (data) => api.post('/promotions', { ...data, loaiKM: data.LoaiKM || 'UuDai' }),
    
    update: (id, data) => api.put(`/promotions/${id}`, data),
    
    delete: (id) => api.delete(`/promotions/${id}`),



    // Kiểm tra tính hợp lệ của voucher
    validateVoucher: async (code, orderAmount) => {
        try {
            const response = await api.get(`/promotions/check-voucher/${code}`, {
                params: { orderTotal: orderAmount }
            });
            const voucher = response.data;
            
            if (!voucher) return { valid: false, message: 'Voucher không hợp lệ.' };
            
            // Tính toán số tiền giảm (logic này có thể để backend trả về luôn, 
            // nhưng ở đây ta tính lại dựa trên thông tin backend gửi về)
            let discount = 0;
            if (voucher.loaiGiamGia === 'PhanTram') {
                discount = (orderAmount * voucher.giaTriGiam) / 100;
                if (voucher.giamToiDa && discount > voucher.giamToiDa) {
                    discount = voucher.giamToiDa;
                }
            } else if (voucher.loaiGiamGia === 'SoTien' || voucher.loaiGiamGia === 'Freeship') {
                discount = voucher.giaTriGiam;
            }
            
            discount = Math.min(discount, orderAmount);
            
            return {
                valid: true,
                maKhuyenMai: voucher.maKhuyenMai,
                tenKM: voucher.tenKM,
                discount: discount,
                finalAmount: orderAmount - discount,
                type: voucher.loaiGiamGia
            };
        } catch (error) {
            const msg = error.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện.';
            return { valid: false, message: msg };
        }
    }
};

export default voucherUuDaiService;

