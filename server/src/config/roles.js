export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'roles.manage',
    'sessions.manage',
    'audit.read',
    'system.manage',
    'profile.read',
    'profile.update',
  ],
  [ROLES.ADMIN]: [
    'users.read',
    'users.create',
    'users.update',
    'sessions.manage',
    'audit.read',
    'profile.read',
    'profile.update',
  ],
  [ROLES.MANAGER]: [
    'users.read',
    'profile.read',
    'profile.update',
  ],
  [ROLES.USER]: [
    'profile.read',
    'profile.update',
  ],
};
