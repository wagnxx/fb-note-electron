export const PERMISSIONS = {
  WRITE: 'write',
  read: 'read',
  delete: 'delete',
  MENU_READ: 'menu_read',
  MENU_EDIT: 'menu_edit',
  MENU_DELETE: 'menu_delete',
  MIND_READ: 'mind_read',
  MIND_EDIT: 'mind_edit',
  MIND_DELETE: 'mind_delete',
  DOCSNAP_CREATE: 'docSnap_create',
  DOCSNAP_READ: 'docSnap_read',
  DOCSNAP_EDIT: 'docSnap_edit',
  DOCSNAP_DELETE: 'docSnap_delete',
} as const

export type PermissionKey = keyof typeof PERMISSIONS
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey]
