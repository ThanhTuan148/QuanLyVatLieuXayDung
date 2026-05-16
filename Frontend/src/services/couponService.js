import api from './api';

const couponService = {
    getAll: () => api.get('/promotions?loai=Coupon'),
    getSystemPromotions: () => api.get('/promotions?loai=UuDai'),
    get: (id) => api.get(`/promotions/${id}`),
    create: (data) => api.post('/promotions', { ...data, loaiKM: 'Coupon' }),
    update: (id, data) => api.put(`/promotions/${id}`, { ...data, loaiKM: 'Coupon' }),
    delete: (id) => api.delete(`/promotions/${id}`),
    verify: (code) => api.get(`/promotions?loai=Coupon`).then(res => {
        const items = res.data || [];
        return items.find(i => i.maApDung?.toUpperCase() === code?.toUpperCase());
    }),

    
    validateCoupon: async (code, orderAmount) => {
        try {
            const response = await api.get(`/promotions/check-voucher/${code}`, {
                params: { orderTotal: orderAmount }
            });
            const coupon = response.data;
            
            if (!coupon) return { valid: false, message: 'Mã giảm giá không hợp lệ.' };

            
            if (orderAmount < coupon.donHangToiThieu) {
                return { 
                    valid: false, 
                    message: `Đơn hàng tối thiểu để sử dụng mã này là ₫${coupon.donHangToiThieu.toLocaleString('vi-VN')}` 
                };
            }
            
            let discount = 0;
            if (coupon.loaiGiamGia === 'PhanTram') {
                discount = (orderAmount * coupon.giaTriGiam) / 100;
                if (coupon.giamToiDa && discount > coupon.giamToiDa) {
                    discount = coupon.giamToiDa;
                }
            } else {
                discount = coupon.giaTriGiam;
            }
            
            // Ensure discount doesn't exceed order amount
            discount = Math.min(discount, orderAmount);
            
            return {
                valid: true,
                code: coupon.maApDung || code,
                discount: discount,
                finalAmount: orderAmount - discount,
                tenKM: coupon.tenKM,
                maKhuyenMai: coupon.maKhuyenMai,
                type: coupon.loaiGiamGia,
                discountValue: coupon.giaTriGiam,
                maxDiscount: coupon.giamToiDa
            };

        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi khi xác thực mã giảm giá.';
            return { valid: false, message: msg };
        }
    }
};

export default couponService;
