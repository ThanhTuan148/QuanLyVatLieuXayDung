import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
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
    map['promotions'] = createMod(true, false, false, false);
    map['flashsales'] = createMod(true, false, false, false);
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
  if (hasQ('Q09')) map['settings'] = createMod(true, true, true, true);

  return map;
};

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState(null); // null means not loaded yet
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setPermissions({});
      setLoading(false);
      return;
    }

      const currentUser = authService.getUser();
      setUser(currentUser);
      const roleStr = String(currentUser?.role || currentUser?.Role || currentUser?.roleName || '').toLowerCase();
      const adminWords = ['admin', 'manager', 'staff', 'nhanvien', 'quanly', 'quản trị', 'quản lý', 'nhân viên', 'kế toán'];
      const isStaff = currentUser?.employeeId || adminWords.some(w => roleStr.includes(w));

      if (!isStaff) {
        setPermissions({});
        setLoading(false);
        return;
      }

      const empId = currentUser?.employeeId;

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

        if (modPerms.length > 0) {
          // Có quyền map cụ thể trong NhanVienModuleQuyen → dùng trực tiếp
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
        } else if (genPerms.length > 0) {
          // Không có module perms nhưng có general perms → auto-map
          setPermissions(autoMapGeneralToModule(genPerms));
        } else {
          // Không có quyền nào được lưu → dùng quyền mặc định theo vai trò
          const role = String(currentUser?.roleName || currentUser?.role || '').toLowerCase();
          const defaultMap = {};
          
          if (role.includes('admin') || role.includes('quản trị') || role.includes('giám đốc') || role.includes('quản lý')) {
            const allModules = ['dashboard', 'products', 'categories', 'inventory', 'orders', 'customers', 'suppliers', 'promotions', 'flashsales', 'deliveries', 'reports', 'settings', 'employees'];
            allModules.forEach(m => {
              defaultMap[m] = { coTheXem: true, coTheTao: true, coTheSua: true, coTheXoa: true };
            });
          } else if (role.includes('tài xế') || role.includes('driver')) {
            defaultMap['deliveries'] = { coTheXem: true, coTheTao: false, coTheSua: false, coTheXoa: false };
          } else if (role.includes('bán hàng') || role.includes('sales')) {
            ['products','orders','customers','promotions'].forEach(m => {
              defaultMap[m] = { coTheXem: true, coTheTao: true, coTheSua: true, coTheXoa: false };
            });
          } else if (role.includes('thủ kho') || role.includes('warehouse')) {
            ['inventory','products'].forEach(m => {
              defaultMap[m] = { coTheXem: true, coTheTao: true, coTheSua: true, coTheXoa: false };
            });
          }
          setPermissions(defaultMap);
        }
      } catch (err) {
        console.error("Lỗi tải quyền", err);
        setPermissions({});
      }

      setLoading(false);
  }, []);

  useEffect(() => {
    fetchPermissions();
    window.addEventListener('permissionsUpdated', fetchPermissions);
    return () => window.removeEventListener('permissionsUpdated', fetchPermissions);
  }, [fetchPermissions]);

  return (
    <PermissionContext.Provider value={{ permissions, user, loading }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionContext);
export default PermissionContext;
