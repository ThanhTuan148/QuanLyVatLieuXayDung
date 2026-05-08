import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import authService from '../services/authService';

export const PermissionContext = createContext();

// Helper auto-map từ quyền chung sang quyền module (giống trong EmployeesPage)
const autoMapGeneralToModule = (generalPerms) => {
  const map = {};
  const hasQ = (code) => generalPerms.some(p => p.maQ === code);
  const createMod = (view, create, update, del) => ({ coTheXem: view, coTheTao: create, coTheSua: update, coTheXoa: del });

  if (hasQ('Q01')) map['employees'] = createMod(true, true, true, true); 
  if (hasQ('Q02')) { 
    map['products'] = createMod(true, true, true, true);
    map['categories'] = createMod(true, true, true, true);
    map['promotions'] = createMod(true, true, true, true);
    map['flashsales'] = createMod(true, true, true, true);
  } else if (hasQ('Q10')) { 
    map['products'] = createMod(true, false, false, false);
    map['categories'] = createMod(true, false, false, false);
  }
  if (hasQ('Q03')) map['orders'] = createMod(true, true, true, true); 
  else if (hasQ('Q11')) map['orders'] = createMod(true, true, false, false); 

  if (hasQ('Q04')) { 
    map['inventory'] = createMod(true, true, true, true);
    map['suppliers'] = createMod(true, true, true, true);
  }
  if (hasQ('Q05')) map['deliveries'] = createMod(true, true, true, true); 
  if (hasQ('Q06')) map['customers'] = createMod(true, true, true, true); 
  if (hasQ('Q07') || hasQ('Q08')) map['reports'] = createMod(true, hasQ('Q08'), false, false); 

  return map;
};

// Fallback quyền Full quyền nếu Admin tối cao
const fullAdminMap = () => {
    const map = {};
    const keys = ['products', 'categories', 'inventory', 'orders', 'customers', 'suppliers', 'flashsales', 'promotions', 'deliveries', 'reports', 'employees'];
    keys.forEach(k => map[k] = { coTheXem: true, coTheTao: true, coTheSua: true, coTheXoa: true });
    return map;
};

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState(null); // null means not loaded yet
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!authService.isAuthenticated()) {
        setPermissions({});
        setLoading(false);
        return;
      }

      const user = authService.getUser();
      const role = user?.role || user?.Role || user?.roleName || '';
      
      // Kiểm tra xem có phải là tài khoản nội bộ bộ máy của cửa hàng không (Khách hàng thì cho pass)
      const roleStr = role.toLowerCase();
      const adminWords = ['admin', 'manager', 'staff', 'nhanvien', 'quanly', 'quản trị', 'quản lý', 'nhân viên', 'kế toán'];
      const isStaff = user?.employeeId || adminWords.some(w => roleStr.includes(w));
      
      if (!isStaff) {
        setPermissions({});
        setLoading(false);
        return;
      }

      // Nếu là Admin tối cao (bao gồm cả 'Quản trị viên'), cấp full quyền luôn cho tiện, khỏi cần check db rườm rà
      if (roleStr.includes('admin') || roleStr.includes('quản trị')) {
          setPermissions(fullAdminMap());
          setLoading(false);
          return;
      }

      const empId = user?.employeeId;
      if (!empId) {
        setPermissions({}); // Nhân viên chưa có data map
        setLoading(false);
        return;
      }

      try {
        const [resGen, resMod] = await Promise.all([
            api.get(`/employees/${empId}/permissions`),
            api.get(`/employees/${empId}/module-permissions`)
        ]);

        const genPerms = resGen.data || [];
        const modPerms = resMod.data || [];

        if (modPerms.length === 0 && genPerms.length > 0) {
            // Dịch từ quyền tổng
            setPermissions(autoMapGeneralToModule(genPerms));
        } else {
            // Có quyền map cụ thể trong NhanVienModuleQuyen
            const map = {};
            modPerms.forEach(mq => {
              map[mq.module] = {
                coTheXem: mq.coTheXem,
                coTheTao: mq.coTheTao,
                coTheSua: mq.coTheSua,
                coTheXoa: mq.coTheXoa
              };
            });
            setPermissions(map);
        }
      } catch (err) {
        console.error("Lỗi tải quyền", err);
        setPermissions({});
      }

      setLoading(false);
    };

    fetchPermissions();
  }, []);

  return (
    <PermissionContext.Provider value={{ permissions, loading }}>
        {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionContext);
export default PermissionContext;
