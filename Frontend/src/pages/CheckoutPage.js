import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Select,
  MenuItem,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Snackbar
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import orderService from '../services/orderService';
import cartService from '../services/cartService';
import customerService from '../services/customerService';
import couponService from '../services/couponService';
import voucherUuDaiService from '../services/voucherUuDaiService';
import CouponInput from '../components/CouponInput';
import GiftsModal from '../components/GiftsModal';
import PromotionSection from '../components/PromotionSection';
import CouponsModal from '../components/CouponsModal';

const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };
  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  const {
    selectedItems: stateItems = [],
    total: stateTotal = 0,
    gifts: stateGifts = [],
    productDiscount: stateProductDiscount = 0,
    manualDiscountAmount: stateManualDiscount = 0,
    promoDiscountAmount: statePromoDiscount = 0,
    appliedManualCoupon: stateManualCoupon = null,
    appliedPromoCoupon: statePromoCoupon = null,
    reorderFrom
  } = location.state || {};

  const [addressForm, setAddressForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'Việt Nam',
    province: '',
    district: '',
    ward: '',
    address: '',
  });

  // Dynamic Address State
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedCodes, setSelectedCodes] = useState({
    provinceCode: '',
    districtCode: '',
    wardCode: '',
  });
  // Check login status
  const isLoggedIn = !!localStorage.getItem('token');

  // Delivery Groups for multi-address
  const [deliveryGroups, setDeliveryGroups] = useState([
    {
      id: Date.now(),
      fullName: '',
      email: '',
      phone: '',
      province: '',
      district: '',
      ward: '',
      address: '',
      provinceCode: '',
      districtCode: '',
      wardCode: '',
      districts: [],
      wards: [],
      selectedItemIds: [], // Cart IDs of regular items
      includeGifts: false // Whether to ship ALL gifts to this address
    }
  ]);

  // Fetch provinces on mount
  useEffect(() => {
    axios.get('https://provinces.open-api.vn/api/p/')
      .then(res => setProvinces(res.data))
      .catch(console.error);

    // Fetch customer info to auto-fill
    const fetchCustomerInfo = async () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const customerId = user.maKhachHang || user.MaKhachHang;
          if (customerId) {
            const res = await customerService.getCustomerById(customerId);
            const customer = res.data || res;

            setAddressForm(prev => ({
              ...prev,
              fullName: customer.tenKH || prev.fullName,
              email: customer.email || prev.email,
              phone: customer.sdt || prev.phone,
            }));

            setDeliveryGroups(prevGroups => {
              if (prevGroups.length > 0) {
                const newGroups = [...prevGroups];
                newGroups[0] = {
                  ...newGroups[0],
                  fullName: customer.tenKH || newGroups[0].fullName,
                  email: customer.email || newGroups[0].email,
                  phone: customer.sdt || newGroups[0].phone,
                };
                return newGroups;
              }
              return prevGroups;
            });
          }
        } catch (error) {
          console.error("Failed to auto-fill customer info:", error);
        }
      }
    };

    if (isLoggedIn) {
      fetchCustomerInfo();
      fetchDebtStatus();
      fetchVouchers();
    }
  }, [isLoggedIn]);

  const fetchVouchers = async () => {
    try {
      const res = await voucherUuDaiService.getAll();
      setAllVouchers(Array.isArray(res.data) ? res.data : (res || []));
    } catch (err) {
      console.error("Failed to fetch vouchers:", err);
    }
  };

  const fetchDebtStatus = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      const customerId = user.maKhachHang || user.MaKhachHang;
      if (!customerId) return;

      // Get current debt
      const debtRes = await customerService.getCustomerById(customerId);
      const customer = debtRes.data || debtRes;

      const res = await axios.get(`http://localhost:5000/api/debts/customer/${customerId}`);
      const debts = res.data || [];
      const total = debts.reduce((sum, d) => sum + (d.soTienConLai || 0), 0);

      const rank = customer.hangThanhVien || 'Đồng';
      const limit = rank === 'Bạc' ? 50000000 : rank === 'Vàng' ? 70000000 : rank === 'Kim cương' ? 100000000 : 20000000;

      setCustomerDebtInfo({ currentDebt: total, limit, rank });
    } catch (err) {
      console.error("Failed to fetch debt status:", err);
    }
  };

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const name = provinces.find(p => p.code === code)?.name || '';
    setSelectedCodes({ ...selectedCodes, provinceCode: code, districtCode: '', wardCode: '' });
    setAddressForm({ ...addressForm, province: name, district: '', ward: '' });
    setDistricts([]);
    setWards([]);
    if (code) {
      axios.get(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
        .then(res => setDistricts(res.data.districts))
        .catch(console.error);
    }
  };

  const handleDistrictChange = (e) => {
    const code = e.target.value;
    const name = districts.find(d => d.code === code)?.name || '';
    setSelectedCodes({ ...selectedCodes, districtCode: code, wardCode: '' });
    setAddressForm({ ...addressForm, district: name, ward: '' });
    setWards([]);
    if (code) {
      axios.get(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
        .then(res => setWards(res.data.wards))
        .catch(console.error);
    }
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    const name = wards.find(w => w.code === code)?.name || '';
    setSelectedCodes({ ...selectedCodes, wardCode: code });
    setAddressForm({ ...addressForm, ward: name });
  };

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [hasNote, setHasNote] = useState(false);
  const [note, setNote] = useState('');
  const [requestVat, setRequestVat] = useState(false);

  // New State for VAT details
  const [vatType, setVatType] = useState('individual'); // 'individual' | 'business'
  const [vatDetails, setVatDetails] = useState({
    buyerName: '',
    email: '',
    // Individual specific
    address: '',
    idCard: '',
    passport: '',
    // Business specific
    companyName: '',
    companyAddress: '',
    taxId: '',
    budgetCode: '',
  });

  const [paymentType, setPaymentType] = useState('full'); // 'full' | 'deposit'
  const [depositAmount, setDepositAmount] = useState(0);
  const [receiptImage, setReceiptImage] = useState(null); // Base64 receipt image

  const [splitShipping, setSplitShipping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Input, 1: Review

  const [customerDebtInfo, setCustomerDebtInfo] = useState({ currentDebt: 0, limit: 20000000, rank: 'Đồng' });

  // Unified Promotion State (initialized from shopping cart if provided)
  const [appliedCoupon, setAppliedCoupon] = useState(stateManualCoupon || statePromoCoupon || null);
  const [allVouchers, setAllVouchers] = useState([]);
  const [giftsModalOpen, setGiftsModalOpen] = useState(false);
  const [couponsOpen, setCouponsOpen] = useState(false);




  const [itemAddresses, setItemAddresses] = useState({}); // Legacy - will be derived from deliveryGroups if needed

  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3); // Mặc định là 3 ngày sau
    return d.toISOString().split('T')[0];
  });

  const minDeliveryDate = new Date().toISOString().split('T')[0];
  const maxDeliveryDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  })();

  // Validation Errors state
  const [errors, setErrors] = useState({});

  const handleFieldChange = (section, field, value) => {
    if (section === 'address') {
      setAddressForm({ ...addressForm, [field]: value });
    } else if (section === 'vat') {
      setVatDetails({ ...vatDetails, [field]: value });
    }
    // Clear error for this field
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };




  const totalDiscount = stateProductDiscount + stateManualDiscount + statePromoDiscount;

  const [selectedItems, setSelectedItems] = useState(stateItems);
  const [gifts, setGifts] = useState(stateGifts);
  
  // Computed Initial Total based on current product prices (the "red box" sum)
  const initialTotal = selectedItems.reduce((sum, item) => 
    sum + ((item.currentPrice || item.price || 0) * (parseInt(item.quantity) || 0)), 0
  );

  useEffect(() => {
    const initReorder = async () => {
      if (reorderFrom && reorderFrom.chiTiet) {
        // 1. Map items and fetch latest info for stock validation and images
        const regularItemsRaw = reorderFrom.chiTiet.filter(i => i.donGia > 0);
        const giftItemsRaw = reorderFrom.chiTiet.filter(i => i.donGia === 0);

        try {
          const detailedItems = await Promise.all(regularItemsRaw.map(async (i) => {
            try {
              const pRes = await axios.get(`http://localhost:5000/api/products/${i.maSanPham}`);
              const p = pRes.data;
              return {
                id: i.maSanPham,
                maSanPham: i.maSanPham,
                tenSanPham: i.tenSanPham,
                productName: i.tenSanPham,
                price: p.giaBan || i.donGia, 
                quantity: i.soLuong,
                currentPrice: p.giaBan || i.donGia,
                cartId: i.maSanPham,
                hinhAnh: p.hinhAnh || i.hinhAnh,
                image: p.hinhAnh || i.hinhAnh, // Consistent with checkout expectation
                soLuongTon: p.soLuongTon || 0,
                sku: p.sku
              };
            } catch (err) {
              return {
                id: i.maSanPham, maSanPham: i.maSanPham, tenSanPham: i.tenSanPham, productName: i.tenSanPham,
                price: i.donGia, quantity: i.soLuong, currentPrice: i.donGia, cartId: i.maSanPham, soLuongTon: 999 
              };
            }
          }));

          const detailedGifts = await Promise.all(giftItemsRaw.map(async (i) => {
            try {
              const pRes = await axios.get(`http://localhost:5000/api/products/${i.maSanPham}`);
              const p = pRes.data;
              return {
                id: i.maSanPham, maSanPham: i.maSanPham, tenSanPham: i.tenSanPham, productName: i.tenSanPham,
                quantity: i.soLuong, hinhAnh: p.hinhAnh, image: p.hinhAnh, soLuongTon: p.soLuongTon
              };
            } catch (err) {
              return { id: i.maSanPham, maSanPham: i.maSanPham, tenSanPham: i.tenSanPham, productName: i.tenSanPham, quantity: i.soLuong, soLuongTon: 999 };
            }
          }));

          setSelectedItems(detailedItems);
          setGifts(detailedGifts);
          setDiscountAmount(reorderFrom.giamGia || 0);
        } catch (err) {
          console.error("Error fetching product details for reorder:", err);
        }

        // 2. Detect if it was split shipping
        const itemAddresses = reorderFrom.chiTiet.map(i => i.diaChiGiaoHang).filter(Boolean);
        const uniqueAddresses = [...new Set(itemAddresses)];
        const isSplit = reorderFrom.diaChiGiaoHang === 'Giao hàng nhiều địa chỉ' || uniqueAddresses.length > 1;

        // 3. Populate contact info
        const fallbackName = reorderFrom.tenNguoiNhan || reorderFrom.tenKhachHang || '';
        const fallbackPhone = reorderFrom.sdtNguoiNhan || reorderFrom.sdtKhachHang || '';
        const fallbackEmail = reorderFrom.emailNguoiNhan || reorderFrom.emailKhachHang || '';

        // Attempt to parse address if not split
        let parsedAddr = { province: '', district: '', ward: '', street: '', pCode: '', dCode: '', wCode: '' };
        if (!isSplit && reorderFrom.diaChiGiaoHang) {
          const parts = reorderFrom.diaChiGiaoHang.split(',').map(p => p.trim());
          if (parts.length >= 4) {
            parsedAddr.province = parts[parts.length - 1];
            parsedAddr.district = parts[parts.length - 2];
            parsedAddr.ward = parts[parts.length - 3];
            parsedAddr.street = parts.slice(0, parts.length - 3).join(', ');

            // Find codes to enable dropdowns
            if (provinces.length > 0) {
              const pMatch = provinces.find(p => p.name.includes(parsedAddr.province) || parsedAddr.province.includes(p.name));
              if (pMatch) {
                parsedAddr.pCode = pMatch.code;
                setSelectedCodes(prev => ({ ...prev, provinceCode: pMatch.code }));
                
                // Fetch districts
                const dRes = await axios.get(`https://provinces.open-api.vn/api/p/${pMatch.code}?depth=2`);
                const dists = dRes.data.districts;
                setDistricts(dists);
                
                const dMatch = dists.find(d => d.name.includes(parsedAddr.district) || parsedAddr.district.includes(d.name));
                if (dMatch) {
                  parsedAddr.dCode = dMatch.code;
                  setSelectedCodes(prev => ({ ...prev, districtCode: dMatch.code }));
                  
                  // Fetch wards
                  const wRes = await axios.get(`https://provinces.open-api.vn/api/d/${dMatch.code}?depth=2`);
                  const wrds = wRes.data.wards;
                  setWards(wrds);
                  
                  const wMatch = wrds.find(w => w.name.includes(parsedAddr.ward) || parsedAddr.ward.includes(w.name));
                  if (wMatch) {
                    parsedAddr.wCode = wMatch.code;
                    setSelectedCodes(prev => ({ ...prev, wardCode: wMatch.code }));
                  }
                }
              }
            }
          } else {
            parsedAddr.street = reorderFrom.diaChiGiaoHang;
          }
        }

        setAddressForm(prev => ({
          ...prev,
          fullName: fallbackName,
          phone: fallbackPhone,
          email: fallbackEmail,
          address: parsedAddr.street || (isSplit ? '' : (reorderFrom.diaChiGiaoHang || '')),
          province: parsedAddr.province,
          district: parsedAddr.district,
          ward: parsedAddr.ward
        }));

        // 4. Multi-address logic
        if (isSplit) {
          setSplitShipping(true);
          const groups = [];
          const addressMap = {};

          for (const item of reorderFrom.chiTiet) {
            const addrStr = item.diaChiGiaoHang || 'Địa chỉ mặc định';
            if (!addressMap[addrStr]) {
              const gParts = addrStr.split(',').map(p => p.trim());
              let gP = '', gD = '', gW = '', gS = addrStr;
              let gPCode = '', gDCode = '', gWCode = '', gDists = [], gWrds = [];
              
              if (gParts.length >= 4) {
                gP = gParts[gParts.length - 1];
                gD = gParts[gParts.length - 2];
                gW = gParts[gParts.length - 3];
                gS = gParts.slice(0, gParts.length - 3).join(', ');

                if (provinces.length > 0) {
                  const pMatch = provinces.find(p => p.name.includes(gP) || gP.includes(p.name));
                  if (pMatch) {
                    gPCode = pMatch.code;
                    const dRes = await axios.get(`https://provinces.open-api.vn/api/p/${pMatch.code}?depth=2`);
                    gDists = dRes.data.districts;
                    const dMatch = gDists.find(d => d.name.includes(gD) || gD.includes(d.name));
                    if (dMatch) {
                      gDCode = dMatch.code;
                      const wRes = await axios.get(`https://provinces.open-api.vn/api/d/${dMatch.code}?depth=2`);
                      gWrds = wRes.data.wards;
                      const wMatch = gWrds.find(w => w.name.includes(gW) || gW.includes(w.name));
                      if (wMatch) gWCode = wMatch.code;
                    }
                  }
                }
              }

              addressMap[addrStr] = {
                id: Date.now() + Math.random(),
                fullName: item.tenNguoiNhan || fallbackName,
                phone: item.sdtNguoiNhan || fallbackPhone,
                email: item.emailNguoiNhan || fallbackEmail,
                address: gS,
                province: gP, district: gD, ward: gW,
                provinceCode: gPCode, districtCode: gDCode, wardCode: gWCode,
                districts: gDists,
                wards: gWrds,
                selectedItemIds: [],
                includeGifts: item.donGia === 0
              };
              groups.push(addressMap[addrStr]);
            }
            if (item.donGia > 0) {
              addressMap[addrStr].selectedItemIds.push(item.maSanPham);
            } else {
              addressMap[addrStr].includeGifts = true;
            }
          }
          setDeliveryGroups(groups);
        }

        // 5. VAT Info
        if (reorderFrom.yeuCauVat) {
          setRequestVat(true);
          setVatType(reorderFrom.vatType || 'individual');
          setVatDetails({
            buyerName: reorderFrom.vatBuyerName || '',
            email: reorderFrom.vatEmail || '',
            address: reorderFrom.vatAddress || '',
            idCard: reorderFrom.vatIdCard || '',
            passport: reorderFrom.vatPassport || '',
            companyName: reorderFrom.vatCompanyName || '',
            companyAddress: reorderFrom.vatCompanyAddress || '',
            taxId: reorderFrom.vatTaxId || '',
            budgetCode: reorderFrom.vatBudgetCode || '',
          });
        }

        setNote(reorderFrom.ghiChu || '');
        setHasNote(!!reorderFrom.ghiChu);
        setPaymentMethod(reorderFrom.pttt?.includes('ATM') ? 'atm' : 'cod');
      }
    };
    initReorder();
  }, [reorderFrom, provinces]);

  const getUniqueAddressesCount = () => {
    if (!splitShipping) return 1;
    return deliveryGroups.length;
  };

  const [discountAmount, setDiscountAmount] = useState(totalDiscount);

  const isManualFreeship = appliedCoupon?.type === 'Freeship' || stateManualCoupon?.type === 'Freeship';
  const isPromoFreeship = appliedCoupon?.type === 'Freeship' || statePromoCoupon?.type === 'Freeship';

  const baseShippingFee = 30000;
  const freeShipThreshold = 500000;
  const isAutoFreeShip = initialTotal >= freeShipThreshold;

  let currentShippingFee = isAutoFreeShip ? 0 : (getUniqueAddressesCount() * baseShippingFee);
  let shippingDiscount = 0;

  if ((isManualFreeship || isPromoFreeship) && !isAutoFreeShip) {
    shippingDiscount = Math.min(currentShippingFee, baseShippingFee); 
  }

  // Calculate Dynamic Discount (Single Coupon Policy)
  let dynamicDiscount = 0;
  const currentCoupon = appliedCoupon || stateManualCoupon || statePromoCoupon;
  
  if (currentCoupon && currentCoupon.type !== 'Freeship') {
    if (currentCoupon.type === 'PhanTram') {
      dynamicDiscount = (initialTotal * currentCoupon.value) / 100;
      if (currentCoupon.limit && dynamicDiscount > currentCoupon.limit) dynamicDiscount = currentCoupon.limit;
    } else {
      dynamicDiscount = currentCoupon.value || stateManualDiscount || statePromoDiscount;
    }
  }

  const grandTotal = Math.max(0, initialTotal + currentShippingFee - shippingDiscount - dynamicDiscount);
  const actualDiscountAmount = dynamicDiscount + stateProductDiscount;

  // Auto-remove coupon if conditions no longer met (e.g. user removed items)
  useEffect(() => {
    const couponToValidate = appliedCoupon || stateManualCoupon || statePromoCoupon;
    if (couponToValidate && couponToValidate.minOrderAmount > 0) {
      if (initialTotal < couponToValidate.minOrderAmount) {
        if (appliedCoupon) setAppliedCoupon(null);
        // Note: state coupons are from navigation, we can't 'null' them easily without complex logic,
        // but since initialTotal is used in calculation, the discount will naturally drop if we handle it there.
        // For simplicity, we just notify and clear the 'appliedCoupon' override.
        showToast(`Mã giảm giá ${couponToValidate.code} đã bị gỡ do đơn hàng không còn đủ điều kiện tối thiểu (${couponToValidate.minOrderAmount.toLocaleString('vi-VN')}₫).`, 'warning');
      }
    }
  }, [initialTotal, appliedCoupon, stateManualCoupon, statePromoCoupon]);

  useEffect(() => {
    if (paymentType === 'deposit') {
      // Only set if current amount is 0 or less, or if we just switched
      const minDeposit = Math.ceil(grandTotal * 0.2);
      if (depositAmount === 0 || depositAmount > grandTotal) {
        setDepositAmount(minDeposit);
      }
    } else if (paymentType === 'full') {
      setDepositAmount(grandTotal);
    }
  }, [grandTotal, paymentType]); // Remove depositAmount from dependency array to allow editing

  // Redirect if no state (direct access)
  useEffect(() => {
    if (!location.state || (!location.state.selectedItems && !location.state.reorderFrom)) {
      navigate('/shopping-cart', { replace: true });
    }
  }, [location, navigate]);

  if (!location.state || (!location.state.selectedItems && !location.state.reorderFrom)) {
    return null;
  }

  const handleAddGroup = () => {
    setDeliveryGroups([...deliveryGroups, {
      id: Date.now(),
      fullName: addressForm.fullName,
      email: addressForm.email,
      phone: addressForm.phone,
      province: '', district: '', ward: '', address: '',
      provinceCode: '', districtCode: '', wardCode: '',
      districts: [], wards: [],
      selectedItemIds: [],
      includeGifts: false
    }]);
  };

  const handleRemoveGroup = (id) => {
    if (deliveryGroups.length > 1) {
      setDeliveryGroups(deliveryGroups.filter(g => g.id !== id));
    }
  };

  const updateGroup = (id, field, value) => {
    setDeliveryGroups(deliveryGroups.map(g => {
      if (g.id === id) {
        return { ...g, [field]: value };
      }
      return g;
    }));
  };

  const handleGroupProvinceChange = async (groupId, code) => {
    const name = provinces.find(p => p.code === code)?.name || '';
    let districtsOfProv = [];
    if (code) {
      const res = await axios.get(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
      districtsOfProv = res.data.districts;
    }
    setDeliveryGroups(deliveryGroups.map(g => g.id === groupId ? {
      ...g, province: name, provinceCode: code, district: '', districtCode: '', ward: '', wardCode: '', districts: districtsOfProv, wards: []
    } : g));
  };

  const handleGroupDistrictChange = async (groupId, code) => {
    const group = deliveryGroups.find(g => g.id === groupId);
    const name = group.districts.find(d => d.code === code)?.name || '';
    let wardsOfDist = [];
    if (code) {
      const res = await axios.get(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
      wardsOfDist = res.data.wards;
    }
    setDeliveryGroups(deliveryGroups.map(g => g.id === groupId ? {
      ...g, district: name, districtCode: code, ward: '', wardCode: '', wards: wardsOfDist
    } : g));
  };

  const toggleItemInGroup = (groupId, itemId) => {
    setDeliveryGroups(deliveryGroups.map(g => {
      if (g.id === groupId) {
        const isSelected = g.selectedItemIds.includes(itemId);
        return {
          ...g,
          selectedItemIds: isSelected
            ? g.selectedItemIds.filter(id => id !== itemId)
            : [...g.selectedItemIds, itemId]
        };
      }
      // If selected in another group, it should be removed from there?
      // Actually, standard UI: one item to one address.
      if (g.id !== groupId && !g.selectedItemIds.includes(itemId)) return g;
      return {
        ...g,
        selectedItemIds: g.selectedItemIds.filter(id => id !== itemId)
      };
    }));
  };

  const toggleGiftsInGroup = (groupId) => {
    setDeliveryGroups(deliveryGroups.map(g => {
      if (g.id === groupId) {
        return { ...g, includeGifts: !g.includeGifts };
      }
      return { ...g, includeGifts: false }; // Only one group can have gifts
    }));
  };

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      showToast('Vui lòng đăng nhập để tiến hành thanh toán.', 'warning');
      navigate('/auth', { state: { returnUrl: '/checkout', ...location.state } });
      return;
    }

    // 0. Stock Validation (Always check before any step transition or final submit)
    const outOfStockItems = selectedItems.filter(item => item.quantity > item.soLuongTon);
    if (outOfStockItems.length > 0) {
      const names = outOfStockItems.map(i => i.productName).join(', ');
      showToast(`⚠️ Một số sản phẩm trong đơn hàng hiện không đủ tồn kho: ${names}. Vui lòng kiểm tra lại.`, 'error');
      return;
    }

    // Vietnamese Standard Regex
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    const cleanPhone = addressForm.phone.replace(/[\s.-]/g, '');
    const cleanPhoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cccdRegex = /^[0-9]{12}$/;
    const taxIdRegex = /^[0-9]{10,13}$/;

    // Validation
    const newErrors = {};
    if (!splitShipping) {
      if (!addressForm.fullName.trim()) newErrors.fullName = 'Bắt buộc';
      if (!addressForm.phone.trim()) {
        newErrors.phone = 'Bắt buộc';
      } else if (!cleanPhoneRegex.test(cleanPhone)) {
        newErrors.phone = 'SĐT không hợp lệ (10 số, đầu 03/05/07/08/09)';
      }
      if (!addressForm.email.trim()) {
        newErrors.email = 'Bắt buộc';
      } else if (!emailRegex.test(addressForm.email)) {
        newErrors.email = 'Email không đúng định dạng';
      }
      if (!addressForm.province) newErrors.province = 'Bắt buộc';
      if (!addressForm.district) newErrors.district = 'Bắt buộc';
      if (!addressForm.ward) newErrors.ward = 'Bắt buộc';
      if (!addressForm.address.trim()) newErrors.address = 'Bắt buộc';
    } else {
      // Validate each group
      deliveryGroups.forEach((g, idx) => {
        const prefix = `g${idx}_`;
        if (!g.fullName.trim()) newErrors[`${prefix}fullName`] = 'Bắt buộc';
        if (!g.phone.trim()) {
          newErrors[`${prefix}phone`] = 'Bắt buộc';
        } else if (!phoneRegex.test(g.phone)) {
          newErrors[`${prefix}phone`] = 'SĐT không hợp lệ';
        }
        if (!g.province) newErrors[`${prefix}province`] = 'Bắt buộc';
        if (!g.district) newErrors[`${prefix}district`] = 'Bắt buộc';
        if (!g.ward) newErrors[`${prefix}ward`] = 'Bắt buộc';
        if (!g.address.trim()) newErrors[`${prefix}address`] = 'Bắt buộc';

        if (g.selectedItemIds.length === 0 && !g.includeGifts) {
          newErrors[`${prefix}items`] = 'Vui lòng chọn ít nhất 1 sản phẩm';
        }
      });

      // Check if all items are assigned
      const assignedItemIds = deliveryGroups.flatMap(g => g.selectedItemIds);
      const allItemIds = selectedItems.map(item => item.cartId || item.id);
      const unassigned = allItemIds.filter(id => !assignedItemIds.includes(id));
      if (unassigned.length > 0) {
        showToast('Vui lòng phân phối tất cả sản phẩm vào các địa chỉ.', 'warning');
        return;
      }
    }

    // VAT Validation
    if (requestVat) {
      if (!vatDetails.buyerName.trim()) newErrors.buyerName = 'Bắt buộc';
      if (!vatDetails.email.trim()) {
        newErrors.email = 'Bắt buộc';
      } else if (!emailRegex.test(vatDetails.email)) {
        newErrors.email = 'Email không hợp lệ';
      }

      if (vatType === 'individual') {
        if (!vatDetails.address.trim()) newErrors.vatAddress = 'Bắt buộc';
        if (vatDetails.idCard.trim() && !cccdRegex.test(vatDetails.idCard)) {
          newErrors.idCard = 'CCCD phải đủ 12 số';
        }
      } else {
        if (!vatDetails.companyName.trim()) newErrors.companyName = 'Bắt buộc';
        if (!vatDetails.companyAddress.trim()) newErrors.companyAddress = 'Bắt buộc';
        if (!vatDetails.taxId.trim()) {
          newErrors.taxId = 'Bắt buộc';
        } else if (!taxIdRegex.test(vatDetails.taxId)) {
          newErrors.taxId = 'MST phải từ 10-13 số';
        }
      }
    }

    if (paymentType === 'deposit') {
      if (depositAmount < grandTotal * 0.2) {
        showToast('Số tiền đặt cọc tối thiểu là 20% giá trị đơn hàng.', 'warning');
        return;
      }
      if (depositAmount > grandTotal) {
        showToast('Số tiền đặt cọc không được vượt quá tổng giá trị đơn hàng.', 'warning');
        return;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      const groupErrorIdx = Object.keys(newErrors).find(k => k.startsWith('g'))?.match(/\d+/)?.[0];
      if (groupErrorIdx !== undefined) {
        showToast(`Vui lòng kiểm tra lại thông tin tại Địa chỉ ${parseInt(groupErrorIdx) + 1}.`, 'error');
      } else {
        showToast('Vui lòng kiểm tra lại thông tin giao hàng.', 'error');
      }
      return;
    }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const mainFullAddress = `${addressForm.address}, ${addressForm.ward}, ${addressForm.district}, ${addressForm.province}`;

      // Construct Order Items with individual addresses
      const orderItems = [];

      if (!splitShipping) {
        selectedItems.forEach(item => {
          orderItems.push({
            maSanPham: item.productId || item.maSanPham || item.id,
            soLuong: item.quantity || item.soLuong || 1,
            donGia: item.price || item.donGia || item.currentPrice || 0,
            giamGia: 0,
            diaChiGiaoHang: mainFullAddress,
            tenNguoiNhan: addressForm.fullName,
            sdtNguoiNhan: addressForm.phone
          });
        });

        // Add gifts to single address
        gifts.forEach(gift => {
          orderItems.push({
            maSanPham: gift.productId || gift.id || gift.maSanPham,
            soLuong: gift.quantity || 1,
            donGia: 0,
            giamGia: 0,
            diaChiGiaoHang: mainFullAddress,
            tenNguoiNhan: addressForm.fullName,
            sdtNguoiNhan: addressForm.phone
          });
        });
      } else {
        deliveryGroups.forEach(g => {
          const groupAddress = `${g.address}, ${g.ward}, ${g.district}, ${g.province}`;
          g.selectedItemIds.forEach(itemId => {
            const item = selectedItems.find(si => (si.cartId || si.id) === itemId);
            if (item) {
              orderItems.push({
                maSanPham: item.productId || item.maSanPham || item.id,
                soLuong: item.quantity || item.soLuong || 1,
                donGia: item.price || item.donGia || item.currentPrice || 0,
                giamGia: 0,
                diaChiGiaoHang: groupAddress,
                tenNguoiNhan: g.fullName,
                sdtNguoiNhan: g.phone
              });
            }
          });

          if (g.includeGifts) {
            gifts.forEach(gift => {
              orderItems.push({
                maSanPham: gift.productId || gift.id,
                soLuong: gift.quantity || 1,
                donGia: 0,
                giamGia: 0,
                diaChiGiaoHang: groupAddress,
                tenNguoiNhan: g.fullName,
                sdtNguoiNhan: g.phone
              });
            });
          }
        });
      }

      const representativeInfo = (splitShipping && deliveryGroups.length > 1)
        ? {
          fullName: deliveryGroups[0].fullName,
          phone: deliveryGroups[0].phone,
          email: deliveryGroups[0].email,
          address: 'Giao hàng nhiều địa chỉ'
        }
        : splitShipping && deliveryGroups.length === 1
          ? {
            fullName: deliveryGroups[0].fullName,
            phone: deliveryGroups[0].phone,
            email: deliveryGroups[0].email,
            address: `${deliveryGroups[0].address}, ${deliveryGroups[0].ward}, ${deliveryGroups[0].district}, ${deliveryGroups[0].province}`
          }
          : {
            fullName: addressForm.fullName,
            phone: addressForm.phone,
            email: addressForm.email,
            address: mainFullAddress
          };

      const orderData = {
        maKhachHang: user?.maKhachHang || user?.MaKhachHang,
        tongTien: grandTotal,
        thanhToan: paymentType === 'deposit' ? depositAmount : grandTotal,
        giamGia: dynamicDiscount,
        maKhuyenMai: appliedCoupon?.id || stateManualCoupon?.id || statePromoCoupon?.id,
        pttt: paymentMethod === 'atm' ? 'Chuyển khoản ATM/Banking (VietQR)' : 'Thanh toán khi nhận hàng (COD)',
        ghiChu: note,
        anhBangChung: receiptImage,

        tenNguoiNhan: representativeInfo.fullName,
        sdtNguoiNhan: representativeInfo.phone,
        emailNguoiNhan: representativeInfo.email,
        diaChiGiaoHang: representativeInfo.address,

        yeuCauVat: requestVat,
        vatType: vatType,
        vatBuyerName: vatDetails.buyerName,
        vatEmail: vatDetails.email,
        vatAddress: vatDetails.address,
        vatIdCard: vatDetails.idCard,
        vatPassport: vatDetails.passport,
        vatCompanyName: vatDetails.companyName,
        vatCompanyAddress: vatDetails.companyAddress,
        vatTaxId: vatDetails.taxId,
        vatBudgetCode: vatDetails.budgetCode,
        ngayGiao: deliveryDate, // Sending the chosen delivery date

        items: orderItems,
        phiVanChuyen: currentShippingFee - shippingDiscount
      };

      const res = await orderService.createOrder(orderData);
      if (res.data) {
        await cartService.clearUserCart();
        showToast('✅ Đặt hàng thành công!', 'success');
        setTimeout(() => {
          navigate('/my-orders', { replace: true });
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Lỗi đặt hàng: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pb: 10 }}>
      <Container maxWidth="lg" sx={{ pt: 1, pb: 3 }}>

        {/* Warning / Login Prompt */}
        {!isLoggedIn && (
          <Alert
            icon={<WarningAmberIcon fontSize="inherit" />}
            severity="warning"
            sx={{ mb: 3, bgcolor: '#fff3cd', color: '#856404', borderRadius: '4px', '& .MuiAlert-icon': { color: '#856404' } }}
          >
            Bạn đã là thành viên? <Typography component="span" onClick={() => navigate('/auth', { state: { returnUrl: '/checkout', ...location.state } })} sx={{ fontWeight: 'bold', color: '#e68c55', cursor: 'pointer' }}>Đăng nhập ngay</Typography>
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Progress Header */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5, gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: currentStep === 0 ? '#c92127' : '#4caf50', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</Box>
                <Typography variant="body2" sx={{ fontWeight: currentStep === 0 ? 'bold' : 'normal' }}>Thông tin giao hàng</Typography>
              </Box>
              <Box sx={{ width: 50, height: 1, bgcolor: '#ddd', alignSelf: 'center' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: currentStep === 1 ? '#c92127' : (currentStep > 1 ? '#4caf50' : '#ddd'), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</Box>
                <Typography variant="body2" sx={{ fontWeight: currentStep === 1 ? 'bold' : 'normal' }}>Kiểm tra hàng</Typography>
              </Box>
              <Box sx={{ width: 50, height: 1, bgcolor: '#ddd', alignSelf: 'center' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: currentStep === 2 ? '#c92127' : '#ddd', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</Box>
                <Typography variant="body2" sx={{ fontWeight: currentStep === 2 ? 'bold' : 'normal' }}>Thanh toán</Typography>
              </Box>
            </Box>
          </Grid>

          {/* Main content column */}
          <Grid item xs={12}>

            {currentStep === 0 ? (
              <>
                {/* STEP 0: INPUT FORM */}
                {/* ĐỊA CHỈ GIAO HÀNG */}
                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '4px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                      Thông tin nhận hàng
                    </Typography>
                    <FormControlLabel
                      control={<Checkbox checked={splitShipping} onChange={e => setSplitShipping(e.target.checked)} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>Tôi muốn giao các sản phẩm đến nhiều địa chỉ khác nhau</Typography>}
                    />
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  {!splitShipping ? (
                    <Grid container spacing={2}>
                      {/* Single Address Fields */}
                      <Grid item xs={12} sm={3}><Typography variant="body2">Họ tên người nhận</Typography></Grid>
                      <Grid item xs={12} sm={9}>
                        <TextField fullWidth size="small" value={addressForm.fullName} onChange={e => handleFieldChange('address', 'fullName', e.target.value)} error={!!errors.fullName} helperText={errors.fullName} />
                      </Grid>

                      <Grid item xs={12} sm={3}><Typography variant="body2">Số điện thoại</Typography></Grid>
                      <Grid item xs={12} sm={9}>
                        <TextField fullWidth size="small" value={addressForm.phone} onChange={e => handleFieldChange('address', 'phone', e.target.value)} error={!!errors.phone} helperText={errors.phone} />
                      </Grid>

                      <Grid item xs={12} sm={3}><Typography variant="body2">Email</Typography></Grid>
                      <Grid item xs={12} sm={9}>
                        <TextField fullWidth size="small" value={addressForm.email} onChange={e => handleFieldChange('address', 'email', e.target.value)} error={!!errors.email} helperText={errors.email} />
                      </Grid>

                      <Grid item xs={12} sm={3}><Typography variant="body2">Tỉnh/Thành Phố</Typography></Grid>
                      <Grid item xs={12} sm={9}>
                        <TextField select fullWidth size="small" value={selectedCodes.provinceCode} onChange={handleProvinceChange} error={!!errors.province} helperText={errors.province}>
                          <MenuItem value="" disabled>Chọn tỉnh/thành Phố</MenuItem>
                          {provinces.map(p => <MenuItem key={p.code} value={p.code}>{p.name}</MenuItem>)}
                        </TextField>
                      </Grid>

                      <Grid item xs={12} sm={3}><Typography variant="body2">Quận/Huyện</Typography></Grid>
                      <Grid item xs={12} sm={9}>
                        <TextField select fullWidth size="small" value={selectedCodes.districtCode} onChange={handleDistrictChange} disabled={!selectedCodes.provinceCode} error={!!errors.district} helperText={errors.district}>
                          <MenuItem value="" disabled>Chọn quận/huyện</MenuItem>
                          {districts.map(d => <MenuItem key={d.code} value={d.code}>{d.name}</MenuItem>)}
                        </TextField>
                      </Grid>

                      <Grid item xs={12} sm={3}><Typography variant="body2">Phường/Xã</Typography></Grid>
                      <Grid item xs={12} sm={9}>
                        <TextField select fullWidth size="small" value={selectedCodes.wardCode} onChange={handleWardChange} disabled={!selectedCodes.districtCode} error={!!errors.ward} helperText={errors.ward}>
                          <MenuItem value="" disabled>Chọn phường/xã</MenuItem>
                          {wards.map(w => <MenuItem key={w.code} value={w.code}>{w.name}</MenuItem>)}
                        </TextField>
                      </Grid>

                      <Grid item xs={12} sm={3}><Typography variant="body2">Địa chỉ cụ thể</Typography></Grid>
                      <Grid item xs={12} sm={9}>
                        <TextField fullWidth size="small" placeholder="Số nhà, tên đường..." value={addressForm.address} onChange={e => handleFieldChange('address', 'address', e.target.value)} error={!!errors.address} helperText={errors.address} />
                      </Grid>
                    </Grid>
                  ) : (
                    <Box>
                      {deliveryGroups.map((group, idx) => (
                        <Paper key={group.id} variant="outlined" sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0', position: 'relative' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle2" color="primary" fontWeight="bold">Địa chỉ {idx + 1}</Typography>
                            {deliveryGroups.length > 1 && (
                              <Button size="small" color="error" onClick={() => handleRemoveGroup(group.id)}>Xóa địa chỉ</Button>
                            )}
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField fullWidth size="small" label="Người nhận" value={group.fullName} onChange={e => updateGroup(group.id, 'fullName', e.target.value)} error={!!errors[`g${idx}_fullName`]} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField fullWidth size="small" label="SĐT" value={group.phone} onChange={e => updateGroup(group.id, 'phone', e.target.value)} error={!!errors[`g${idx}_phone`]} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField select fullWidth size="small" label="Tỉnh/TP" value={group.provinceCode} onChange={e => handleGroupProvinceChange(group.id, e.target.value)} error={!!errors[`g${idx}_province`]}>
                                {provinces.map(p => <MenuItem key={p.code} value={p.code}>{p.name}</MenuItem>)}
                              </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField select fullWidth size="small" label="Quận/Huyện" value={group.districtCode} onChange={e => handleGroupDistrictChange(group.id, e.target.value)} disabled={!group.provinceCode} error={!!errors[`g${idx}_district`]}>
                                {group.districts.map(d => <MenuItem key={d.code} value={d.code}>{d.name}</MenuItem>)}
                              </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField select fullWidth size="small" label="Phường/Xã" value={group.wardCode} onChange={e => {
                                const name = group.wards.find(w => w.code === e.target.value)?.name || '';
                                setDeliveryGroups(deliveryGroups.map(g => g.id === group.id ? { ...g, ward: name, wardCode: e.target.value } : g));
                              }} disabled={!group.districtCode} error={!!errors[`g${idx}_ward`]}>
                                {group.wards.map(w => <MenuItem key={w.code} value={w.code}>{w.name}</MenuItem>)}
                              </TextField>
                            </Grid>
                            <Grid item xs={12}>
                              <TextField fullWidth size="small" label="Địa chỉ cụ thể" value={group.address} onChange={e => updateGroup(group.id, 'address', e.target.value)} error={!!errors[`g${idx}_address`]} />
                            </Grid>
                          </Grid>

                          <Typography variant="body2" fontWeight="bold" sx={{ mt: 3, mb: 1, color: errors[`g${idx}_items`] ? 'error.main' : 'inherit' }}>
                            Chọn sản phẩm giao đến địa chỉ này: {errors[`g${idx}_items`] && <span style={{ fontWeight: 'normal', fontSize: '0.8rem' }}>({errors[`g${idx}_items`]})</span>}
                          </Typography>
                          <Box sx={{ bgcolor: '#fafafa', p: 1, borderRadius: 1, border: errors[`g${idx}_items`] ? '1px solid #d32f2f' : 'none' }}>
                            {selectedItems.map(item => {
                              const itemId = item.cartId || item.id;
                              const isAssignedElsewhere = deliveryGroups.some(g => g.id !== group.id && g.selectedItemIds.includes(itemId));
                              return (
                                <FormControlLabel
                                  key={itemId}
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={group.selectedItemIds.includes(itemId)}
                                      onChange={() => toggleItemInGroup(group.id, itemId)}
                                      disabled={isAssignedElsewhere}
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <img src={item.image} width="30" height="30" alt="" style={{ borderRadius: 2 }} />
                                      <Typography variant="body2" sx={{ color: isAssignedElsewhere ? 'text.disabled' : 'text.primary' }}>
                                        {item.productName} (x{item.quantity})
                                      </Typography>
                                    </Box>
                                  }
                                  sx={{ display: 'block', mb: 0.5 }}
                                />
                              );
                            })}
                          </Box>

                          {gifts.length > 0 && (
                            <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #ccc' }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    size="small"
                                    sx={{ color: '#e68c55', '&.Mui-checked': { color: '#e68c55' } }}
                                    checked={group.includeGifts}
                                    onChange={() => toggleGiftsInGroup(group.id)}
                                    disabled={deliveryGroups.some(g => g.id !== group.id && g.includeGifts)}
                                  />
                                }
                                label={
                                  <Typography variant="body2" sx={{ color: '#e68c55', fontWeight: 'bold' }}>
                                    Chuyển TẤT CẢ quà tặng đến địa chỉ này
                                  </Typography>
                                }
                              />
                            </Box>
                          )}
                        </Paper>
                      ))}

                      <Button variant="outlined" startIcon={<span>+</span>} onClick={handleAddGroup} sx={{ mt: 1, textTransform: 'none' }}>
                        Thêm địa chỉ giao hàng mới
                      </Button>
                    </Box>
                  )}
                </Paper>

                {/* THỜI GIAN GIAO HÀNG */}
                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '4px', borderLeft: '4px solid #e68c55' }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, textTransform: 'uppercase' }}>
                    Thời gian nhận hàng dự kiến
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2">Ngày giao hàng mong muốn:</Typography>
                      <Typography variant="caption" color="text.secondary">
                        (Giao nhanh nhất có thể hoặc theo lịch của bạn)
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        inputProps={{
                          min: minDeliveryDate,
                          max: maxDeliveryDate
                        }}
                        helperText={`Hệ thống cam kết giao hàng trễ nhất trong vòng 3 ngày (đến ngày ${new Date(maxDeliveryDate).toLocaleDateString('vi-VN')})`}
                        sx={{ maxWidth: 300 }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* KHUYẾN MÃI & QUÀ TẶNG (NEW FOR REORDER) */}
                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '4px', borderLeft: '4px solid #4caf50' }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, textTransform: 'uppercase' }}>
                    🎁 Ưu đãi & Quà tặng
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                       <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>Mã giảm giá (Coupon):</Typography>
                       <CouponInput 
                         orderAmount={initialTotal}
                         onCouponApply={(data) => {
                           if (appliedCoupon?.code === data.code) return;
                           if (data.type === 'Freeship' && isAutoFreeShip) {
                             showToast("Đơn hàng đã được freeship, vui lòng chọn mã khuyến mãi khác", "info");
                             return;
                           }
                           setAppliedCoupon({
                             id: data.id, code: data.code, type: data.type, value: data.discountValue, limit: data.maxDiscount,
                             minOrderAmount: data.minOrderAmount || 0
                           });
                         }}
                         systemVoucherCodes={allVouchers.map(v => v.maApDung)}
                       />
                       
                       <Box sx={{ mt: 3 }}>
                         <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>Ưu đãi hệ thống & Quà tặng:</Typography>
                         <PromotionSection 
                           currentTotal={initialTotal}
                           appliedCode={(appliedCoupon || stateManualCoupon || statePromoCoupon)?.code}
                           onOpenCoupons={() => setCouponsOpen(true)}
                           onOpenGifts={() => setGiftsModalOpen(true)}
                           onBuyMore={() => {
                             if (window.confirm('Xác nhận quay về trang chủ để mua thêm sản phẩm?')) {
                               navigate('/shopping');
                             }
                           }}
                           eligibleCount={allVouchers.filter(v => v.donHangToiThieu <= initialTotal).length}
                           selectedGiftsCount={gifts.length}
                           giftLimit={3}
                         />
                       </Box>
                    </Grid>
                  </Grid>
                </Paper>




                {/* THÔNG TIN KHÁC */}
                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '4px' }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, textTransform: 'uppercase' }}>
                    Thông tin khác
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={<Checkbox size="small" checked={hasNote} onChange={(e) => setHasNote(e.target.checked)} />}
                      label={<Typography variant="body2">Ghi chú</Typography>}
                    />
                    {hasNote && (
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Ghi chú thêm về đơn hàng..."
                        multiline rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        sx={{ ml: 4, width: 'calc(100% - 32px)', mb: 2 }}
                      />
                    )}

                    <FormControlLabel
                      control={<Checkbox size="small" checked={requestVat} onChange={(e) => setRequestVat(e.target.checked)} />}
                      label={
                        <Typography variant="body2">Xuất hóa đơn GTGT <span style={{ color: '#1976d2', cursor: 'pointer' }}>Chi tiết</span></Typography>
                      }
                    />
                    {requestVat && (
                      <Box sx={{ ml: 4, mt: 1 }}>
                        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 2 }}>
                          *Từ 01/07/2025, Quý khách chịu trách nhiệm về thông tin địa chỉ xuất Hóa đơn theo quy định Hành chính mới. Hệ thống sẽ không xuất lại hóa đơn nếu thông tin không đúng.
                        </Typography>

                        <RadioGroup
                          row value={vatType}
                          onChange={(e) => {
                            setVatType(e.target.value);
                            setErrors({}); // Clear VAT errors on type switch
                          }}
                          sx={{ mb: 2 }}
                        >
                          <FormControlLabel value="individual" control={<Radio size="small" color="error" />} label={<Typography variant="body2">Cá nhân</Typography>} />
                          <FormControlLabel value="business" control={<Radio size="small" color="error" />} label={<Typography variant="body2">Doanh nghiệp</Typography>} sx={{ ml: 2 }} />
                        </RadioGroup>

                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth size="small" label="Họ tên người mua hàng"
                              placeholder="Nhập họ tên người mua hàng"
                              value={vatDetails.buyerName}
                              onChange={(e) => handleFieldChange('vat', 'buyerName', e.target.value)}
                              error={!!errors.buyerName}
                              helperText={errors.buyerName}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>

                          {vatType === 'individual' ? (
                            <>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth size="small" label="Địa chỉ cá nhân"
                                  placeholder="Nhập địa chỉ cá nhân"
                                  value={vatDetails.address}
                                  onChange={(e) => handleFieldChange('vat', 'address', e.target.value)}
                                  error={!!errors.vatAddress}
                                  helperText={errors.vatAddress}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth size="small" label="Căn cước công dân"
                                  placeholder="Nhập căn cước công dân"
                                  value={vatDetails.idCard}
                                  onChange={(e) => handleFieldChange('vat', 'idCard', e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth size="small" label="Số hộ chiếu"
                                  placeholder="Nhập số hộ chiếu"
                                  value={vatDetails.passport}
                                  onChange={(e) => handleFieldChange('vat', 'passport', e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>
                            </>
                          ) : (
                            <>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth size="small" label="Tên doanh nghiệp *"
                                  placeholder="Nhập tên doanh nghiệp"
                                  value={vatDetails.companyName}
                                  onChange={(e) => handleFieldChange('vat', 'companyName', e.target.value)}
                                  error={!!errors.companyName}
                                  helperText={errors.companyName}
                                  InputLabelProps={{ shrink: true }}
                                  required
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth size="small" label="Địa chỉ doanh nghiệp *"
                                  placeholder="Nhập địa chỉ doanh nghiệp"
                                  value={vatDetails.companyAddress}
                                  onChange={(e) => handleFieldChange('vat', 'companyAddress', e.target.value)}
                                  error={!!errors.companyAddress}
                                  helperText={errors.companyAddress}
                                  InputLabelProps={{ shrink: true }}
                                  required
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth size="small" label="Mã số thuế *"
                                  placeholder="Nhập mã số thuế"
                                  value={vatDetails.taxId}
                                  onChange={(e) => handleFieldChange('vat', 'taxId', e.target.value)}
                                  error={!!errors.taxId}
                                  helperText={errors.taxId}
                                  InputLabelProps={{ shrink: true }}
                                  required
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth size="small" label="Mã đơn vị QHNS"
                                  placeholder="Nhập mã đơn vị quan hệ ngân sách"
                                  value={vatDetails.budgetCode}
                                  onChange={(e) => handleFieldChange('vat', 'budgetCode', e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Grid>
                            </>
                          )}

                          <Grid item xs={12}>
                            <TextField
                              fullWidth size="small" label="Email nhận hóa đơn *"
                              placeholder="Nhập email nhận hóa đơn"
                              value={vatDetails.email}
                              onChange={(e) => handleFieldChange('vat', 'email', e.target.value)}
                              error={!!errors.vatEmail}
                              helperText={errors.vatEmail}
                              InputLabelProps={{ shrink: true }}
                              required
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Box>
                </Paper>
                {/* KIỂM TRA LẠI ĐƠN HÀNG */}
                <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '4px' }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, textTransform: 'uppercase' }}>
                    Kiểm tra lại đơn hàng
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(() => {
                      const allItems = [
                        ...selectedItems.map(i => ({ ...i, isGift: false })),
                        ...gifts.map(g => ({ ...g, isGift: true }))
                      ];

                      // Group by address
                      const groups = {};

                      if (!splitShipping) {
                        const mainAddress = `${addressForm.address}, ${addressForm.ward}, ${addressForm.district}, ${addressForm.province}`;
                        groups[mainAddress] = { items: allItems, receiver: addressForm.fullName, phone: addressForm.phone };
                      } else {
                        deliveryGroups.forEach(g => {
                          const addr = `${g.address}, ${g.ward}, ${g.district}, ${g.province}`;
                          if (!groups[addr]) {
                            groups[addr] = { items: [], receiver: g.fullName, phone: g.phone };
                          }

                          g.selectedItemIds.forEach(itemId => {
                            const item = allItems.find(si => !si.isGift && (si.cartId || si.id) === itemId);
                            if (item) groups[addr].items.push(item);
                          });

                          if (g.includeGifts) {
                            const giftItems = allItems.filter(si => si.isGift);
                            groups[addr].items.push(...giftItems);
                          }
                        });
                      }

                      return Object.entries(groups).map(([address, data], gIdx) => (
                        <Box key={gIdx} sx={{ mb: 2 }}>
                          <Box sx={{ bgcolor: '#f8f9fa', p: 1.5, borderRadius: 1, mb: 1, border: '1px solid #eee' }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="primary">
                              📍 Địa chỉ {Object.keys(groups).length > 1 ? gIdx + 1 : ''}: {address !== ', , , ' ? address : 'Chưa nhập địa chỉ'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Người nhận: {data.receiver || '...'} | SĐT: {data.phone || '...'}
                            </Typography>
                          </Box>

                          {data.items.map((item, idx) => (
                            <React.Fragment key={`${item.cartId || item.id}-${idx}`}>
                              <Grid container spacing={2} alignItems="center" sx={{ mb: 1, pl: 2 }}>
                                <Grid item xs={2} sm={1}>
                                  <Box sx={{ position: 'relative' }}>
                                    <img src={item.image} alt={item.productName || item.name} style={{ width: '100%', borderRadius: '4px' }} />
                                    {item.isGift && (
                                      <Box sx={{ position: 'absolute', top: -5, left: -5, bgcolor: '#d32f2f', color: '#fff', fontSize: '10px', px: 0.5, borderRadius: '2px' }}>Quà tặng</Box>
                                    )}
                                  </Box>
                                </Grid>
                                <Grid item xs={5} sm={7}>
                                  <Typography variant="body2">{item.productName || item.name}</Typography>
                                </Grid>
                                <Grid item xs={2} sm={1} textAlign="right">
                                  <Typography variant="body2">{item.isGift ? '0đ' : formatVND(item.currentPrice)}</Typography>
                                  {item.hasDiscount && !item.isGift && (
                                    <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                      {formatVND(item.originalPrice)}
                                    </Typography>
                                  )}
                                </Grid>
                                <Grid item xs={1} sm={1} textAlign="center">
                                  <Typography variant="body2">{item.quantity || 1}</Typography>
                                </Grid>
                                <Grid item xs={2} sm={2} textAlign="right">
                                  <Typography variant="body2" fontWeight="bold" color="#e68c55">
                                    {item.isGift ? '0đ' : formatVND(item.currentPrice * (item.quantity || 1))}
                                  </Typography>
                                </Grid>
                              </Grid>
                              {idx < data.items.length - 1 && <Divider sx={{ my: 1, ml: 2 }} />}
                            </React.Fragment>
                          ))}
                        </Box>
                      ));
                    })()}
                  </Box>
                </Paper>

                {/* PHƯƠNG THỨC THANH TOÁN - MOVED TO STEP 2 */}


              </>
            ) : currentStep === 1 ? (
              <Box>
                {/* STEP 1: REVIEW ORDER */}
                <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: '4px' }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1.5, textAlign: 'center', color: '#c92127' }}>
                    KIỂM TRA ĐƠN HÀNG
                  </Typography>
                  <Divider sx={{ mb: 2.5 }} />

                  <Grid container spacing={3}>
                    {/* Summary Info */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>👤 NGƯỜI NHẬN</Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2">{addressForm.fullName} - {addressForm.phone}</Typography>
                          <Typography variant="body2" color="text.secondary">{addressForm.email}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>📍 ĐỊA CHỈ GIAO</Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2">{addressForm.address}, {addressForm.ward}, {addressForm.district}, {addressForm.province}</Typography>
                          <Typography variant="body2" sx={{ mt: 1, color: '#2e7d32', fontWeight: 'bold' }}>
                            📅 Ngày giao: {new Date(deliveryDate).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                          TỔNG KẾT CHI PHÍ
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Tạm tính:</Typography>
                          <Typography variant="body2" fontWeight="500">{formatVND(initialTotal)}</Typography>
                        </Box>

                        {actualDiscountAmount > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Giảm giá sản phẩm:</Typography>
                            <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 600 }}>-{formatVND(actualDiscountAmount)}</Typography>
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Phí vận chuyển:</Typography>
                          <Box sx={{ textAlign: 'right' }}>
                            {currentShippingFee > 0 ? (
                              <>
                                <Typography variant="body2" fontWeight="500" sx={{ textDecoration: shippingDiscount > 0 ? 'line-through' : 'none', color: shippingDiscount > 0 ? '#aaa' : 'inherit' }}>
                                  {formatVND(currentShippingFee)}
                                </Typography>
                                {shippingDiscount > 0 && (
                                  <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold', display: 'block' }}>
                                    Miễn phí (Mã Freeship)
                                  </Typography>
                                )}
                              </>
                            ) : (
                              <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>Miễn phí</Typography>
                            )}
                          </Box>
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1" fontWeight="bold">Tổng cộng:</Typography>
                          <Typography variant="h6" fontWeight="bold" color="error">{formatVND(grandTotal)}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>📦 DANH SÁCH SẢN PHẨM</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell>Sản phẩm</TableCell>
                            <TableCell align="right">Đơn giá</TableCell>
                            <TableCell align="center">Số lượng</TableCell>
                            <TableCell align="right">Thành tiền</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedItems.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <img src={item.image} width="40" height="40" style={{ borderRadius: 4 }} alt="" />
                                  <Typography variant="body2">{item.productName}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right">{formatVND(item.currentPrice)}</TableCell>
                              <TableCell align="center">{item.quantity}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatVND(item.currentPrice * item.quantity)}</TableCell>
                            </TableRow>
                          ))}
                          {gifts.map((item, idx) => (
                            <TableRow key={`gift-${idx}`}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <img src={item.image} width="40" height="40" style={{ borderRadius: 4 }} alt="" />
                                  <Box>
                                    <Typography variant="body2">{item.productName}</Typography>
                                    <Chip label="Quà tặng" size="small" sx={{ height: 18, fontSize: '10px', bgcolor: '#e68c55', color: '#fff' }} />
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="right">Miễn phí</TableCell>
                              <TableCell align="center">{item.quantity}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>0đ</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button variant="text" onClick={() => setCurrentStep(0)} sx={{ color: '#777', textTransform: 'none' }}>
                      ← Quay lại bước 1
                    </Button>
                  </Box>
                </Paper>
              </Box>
            ) : (
              <Box>
                {/* STEP 2: PAYMENT METHOD */}
                <Paper elevation={0} sx={{ p: 4, mb: 3, borderRadius: '4px' }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'center', color: '#c92127' }}>
                    CHỌN PHƯƠNG THỨC THANH TOÁN
                  </Typography>
                  <Divider sx={{ mb: 4 }} />

                  <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                    {/* REUSE PAYMENT SELECTION UI HERE */}
                    <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <Paper variant="outlined" sx={{ p: 2, mb: 2, border: paymentMethod === 'atm' ? '2px solid #c92127' : '1px solid #e0e0e0' }}>
                        <FormControlLabel value="atm" control={<Radio size="small" />} label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">ATM / Internet Banking (VietQR)</Typography>
                            <Box component="span" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontSize: '10px', px: 1, borderRadius: '10px', fontWeight: 'bold' }}>KHUYÊN DÙNG</Box>
                          </Box>
                        } />
                        {paymentMethod === 'atm' && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 2, textAlign: 'center' }}>
                            <Box sx={{ mt: 3, textAlign: 'center', bgcolor: '#fff', p: 3, borderRadius: 2, border: '1px solid #eee' }}>
                              <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>THÔNG TIN CHUYỂN KHOẢN</Typography>
                              <Typography variant="subtitle1"><strong>Ngân hàng:</strong> Vietcombank</Typography>
                              <Typography variant="h5" fontWeight="bold" sx={{ my: 1, color: '#c92127' }}><strong>Số TK:</strong> 1031657749</Typography>
                              <Typography variant="subtitle1"><strong>Chủ TK:</strong> TRƯƠNG THANH TUẤN</Typography>
                              <Typography variant="h5" fontWeight="bold" sx={{ mt: 2, color: '#2e7d32', p: 1, bgcolor: '#e8f5e9', display: 'inline-block', borderRadius: 1 }}>
                                SỐ TIỀN THANH TOÁN: {formatVND(paymentType === 'deposit' ? depositAmount : grandTotal)}
                              </Typography>
                              {paymentType === 'deposit' && (
                                <Typography variant="body2" sx={{ mt: 1, color: '#d32f2f', fontWeight: 'bold' }}>
                                  Số tiền còn nợ: {formatVND(grandTotal - depositAmount)}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                              <img
                                src={`https://img.vietqr.io/image/vcb-1031657749-compact2.png?amount=${paymentType === 'deposit' ? depositAmount : grandTotal}&addInfo=THANH TOAN DON HANG&accountName=TRUONG THANH TUAN`}
                                alt="VietQR"
                                style={{ width: 200, border: '1px solid #ddd', padding: 8, background: '#fff' }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ mt: 1 }}>Quét mã để thanh toán nhanh chóng</Typography>

                            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Button variant="outlined" component="label" size="small" startIcon={<span>📷</span>}>
                                {receiptImage ? "Đổi ảnh khác" : "Tải ảnh chứng từ"}
                                <input type="file" hidden accept="image/*" onChange={handleReceiptUpload} />
                              </Button>

                              {receiptImage && (
                                <Box sx={{ position: 'relative', width: 80, height: 80 }}>
                                  <img
                                    src={receiptImage}
                                    alt="Receipt Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                                  />
                                  <Button
                                    size="small"
                                    sx={{
                                      position: 'absolute', top: -10, right: -10,
                                      minWidth: 20, height: 20, borderRadius: '50%',
                                      bgcolor: 'error.main', color: '#fff', p: 0,
                                      '&:hover': { bgcolor: '#a8161a' }
                                    }}
                                    onClick={() => setReceiptImage(null)}
                                  >
                                    ×
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        )}
                      </Paper>

                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2, mb: 2,
                          border: paymentMethod === 'cod' ? '2px solid #c92127' : '1px solid #e0e0e0',
                          opacity: (customerDebtInfo.currentDebt + grandTotal > customerDebtInfo.limit) ? 0.6 : 1
                        }}
                      >
                        <FormControlLabel
                          value="cod"
                          control={<Radio size="small" disabled={customerDebtInfo.currentDebt + grandTotal > customerDebtInfo.limit} />}
                          label={
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">Thanh toán tiền mặt khi nhận hàng (COD)</Typography>
                              {customerDebtInfo.currentDebt + grandTotal > customerDebtInfo.limit && (
                                <Typography variant="caption" color="error" sx={{ display: 'block', fontWeight: 'bold' }}>
                                  ⚠️ Bạn đã vượt hạn mức nợ ({formatVND(customerDebtInfo.limit)}). Vui lòng chọn Chuyển khoản (ATM) 100%.
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </Paper>
                    </RadioGroup>

                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 4, mb: 2, color: '#c92127' }}>HÌNH THỨC THANH TOÁN</Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff9f9', border: '1px solid #ffcdd2' }}>
                      <RadioGroup value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                        <FormControlLabel
                          value="full"
                          control={<Radio size="small" />}
                          label={<Typography variant="body2">Thanh toán 100% (<b>{formatVND(grandTotal)}</b>)</Typography>}
                        />
                        <FormControlLabel
                          value="deposit"
                          control={<Radio size="small" disabled={customerDebtInfo.currentDebt + (grandTotal - (paymentType === 'deposit' ? depositAmount : grandTotal * 0.2)) > customerDebtInfo.limit} />}
                          label={
                            <Box>
                              <Typography variant="body2">Thanh toán đặt cọc trước (Tối thiểu 20%)</Typography>
                              <Typography variant="caption" color="text.secondary">Ghi nhận công nợ cho số tiền còn lại</Typography>
                              {customerDebtInfo.currentDebt + (grandTotal - (paymentType === 'deposit' ? depositAmount : grandTotal * 0.2)) > customerDebtInfo.limit && (
                                <Typography variant="caption" color="error" sx={{ display: 'block', fontWeight: 'bold' }}>
                                  ⚠️ Không thể chọn đặt cọc vì dư nợ vượt hạn mức {formatVND(customerDebtInfo.limit)}.
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </RadioGroup>

                      {paymentType === 'deposit' && (
                        <Box sx={{ mt: 2, pl: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <TextField
                            size="small" label="Số tiền cọc (VND)" type="number"
                            value={depositAmount}
                            onChange={e => setDepositAmount(parseInt(e.target.value) || 0)}
                            helperText={`Tối thiểu: ${formatVND(grandTotal * 0.2)}`}
                            sx={{ width: 250 }}
                            InputProps={{
                              endAdornment: <Typography variant="caption">VNĐ</Typography>
                            }}
                          />
                          <Box>
                            <Typography variant="caption" sx={{ display: 'block' }}>Số tiền còn lại:</Typography>
                            <Typography variant="subtitle2" color="error" fontWeight="bold">{formatVND(grandTotal - depositAmount)}</Typography>
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  </Box>

                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button variant="text" onClick={() => setCurrentStep(1)} sx={{ color: '#777', textTransform: 'none' }}>
                      ← Quay lại bước 2 (Kiểm tra hàng)
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}


          </Grid>
        </Grid>
      </Container>

      <GiftsModal
        open={giftsModalOpen}
        onClose={() => setGiftsModalOpen(false)}
        currentTotal={initialTotal}
        selectedGifts={gifts}
        onSelect={(newGifts) => setGifts(newGifts)}
      />

      <CouponsModal
        open={couponsOpen}
        onClose={() => setCouponsOpen(false)}
        coupons={allVouchers}
        currentTotal={initialTotal}
        appliedCode={(appliedCoupon || statePromoCoupon)?.code}
        onApply={(uudai) => {
          if (uudai) {
            if (appliedCoupon?.code === uudai.maApDung) {
              setCouponsOpen(false);
              return;
            }
            if (uudai.loaiGiamGia === 'Freeship' && isAutoFreeShip) {
              showToast("Đơn hàng đã được freeship, vui lòng chọn mã khuyến mãi khác", "info");
              return;
            }
            setAppliedCoupon({ 
              id: uudai.maKhuyenMai, 
              code: uudai.maApDung, 
              type: uudai.loaiGiamGia,
              value: uudai.giaTriGiam,
              limit: uudai.giamToiDa,
              minOrderAmount: uudai.donHangToiThieu || 0
            });
            setCouponsOpen(false);
          }
        }}
      />

      {/* STICKY BOTTOM BAR */}
      <Box sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        bgcolor: '#fff', borderTop: '1px solid #eee',
        p: 2, px: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        zIndex: 1000
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Bằng việc tiến hành Mua hàng, Bạn đã đồng ý với
          </Typography>
          <br />
          <Typography variant="caption" color="#1976d2" sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
            Điều khoản & Điều kiện của Hệ thống
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Phí vận chuyển: {(currentShippingFee - shippingDiscount) === 0 ? "Miễn phí" : formatVND(currentShippingFee - shippingDiscount)}
            </Typography>
            <Typography variant="h6" color="#d32f2f" fontWeight="bold">
              {formatVND(grandTotal)}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleCheckout}
            sx={{
              bgcolor: '#c92127', color: '#fff', borderRadius: '4px', px: 4, py: 1.5,
              fontWeight: 'bold', fontSize: '1rem',
              '&:hover': { bgcolor: '#a8161a' }
            }}
          >
            {currentStep === 0 ? "Tiếp tục" : (currentStep === 1 ? "Tiếp tục thanh toán" : "Xác nhận đặt hàng")}
          </Button>
        </Box>
      </Box>
      <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CheckoutPage;
