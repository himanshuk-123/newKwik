import { loginApi } from '../services/ApiClient';
import { LoginRequest, LoginResponse } from '../types/api';
import { select, run } from '../database/db';
import { syncAllData } from './syncService';

export interface StoredUser {
  id: number;
  user_id: string;
  login_user_id: string;
  mobile: string;
  email: string;
  shop_name: string;
  token: string;
  role_id: number;
  role_name: string;
  sub_role_id: number;
  sub_role_name: string;
  profile_image: string;
  otp_check: string;
}

/** Save login response to local DB */
const saveUser = async (res: LoginResponse): Promise<void> => {
  await run(
    `INSERT OR REPLACE INTO users
      (user_id, login_user_id, mobile, email, shop_name, token,
       role_id, role_name, sub_role_id, sub_role_name, otp_check, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      res.USERID,
      res.LoginUserId,
      res.MOBILENUMBER,
      res.EMAIL,
      res.SHOPNAME,
      res.TOKENID,
      res.RoleId,
      res.RoleName,
      res.SubRoleId,
      res.SubRoleName,
      res.OTPCheck,
    ]
  );
};

/** Get saved user from local DB */
export const getStoredUser = async (): Promise<StoredUser | null> => {
  const rows = await select<StoredUser>('SELECT * FROM users LIMIT 1');
  return rows[0] ?? null;
};

/** Login — calls API, saves to DB, returns stored user */
export const login = async (credentials: LoginRequest): Promise<StoredUser> => {
  const res = await loginApi(credentials);
  console.log('[AuthService] Login API response:', res);

  if (res.ERROR !== '0' || res.STATUSCODE !== '1') {
    throw new Error(res.MESSAGE || 'Login failed');
  }

  await saveUser(res);
  await syncAllData(res.TOKENID, res.USERID);

  const user = await getStoredUser();
  if (!user) throw new Error('Failed to retrieve saved user');
  return user;
};

/** Clear user on logout */
export const logout = async (): Promise<void> => {
  // ✅ FIX: Added [] params to all run() calls — good practice even though defaults exist
  await run('DELETE FROM users', []);
  await run('DELETE FROM dashboard', []);
  await run('DELETE FROM leads', []);             // ✅ Also clear leads on logout
  await run('DELETE FROM pending_leads', []);     // ✅ Also clear pending queue on logout
  await run("UPDATE sync_meta SET status = 'pending', last_synced_at = NULL", []);
};