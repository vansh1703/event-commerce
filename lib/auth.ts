// lib/auth.ts

export const SUPERADMIN_EMAIL = "admin@eventhire.com";
export const SUPERADMIN_PASSWORD = "SuperAdmin@2026";

export const isSuperAdmin = (email: string): boolean => {
  return email === SUPERADMIN_EMAIL;
};

export const checkSuperAdminAuth = (): boolean => {
  const user = localStorage.getItem("posterUser");
  if (!user) return false;
  
  const parsedUser = JSON.parse(user);
  return parsedUser.email === SUPERADMIN_EMAIL || parsedUser.user_type === "superadmin";
};