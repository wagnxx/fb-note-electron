import { addDocToCol, getDocsByCondition, getFieldValues } from '@/firebase/db'
import type { DocumentData } from 'firebase/firestore'
const COL_ORGANIZATIONS = 'organizations'
const COL_ORGMEMBERS = 'orgMembers'
const COL_ROLES = 'roles'

export type Tag = {
  name: string
  id: string
}

// 创建文件夹
export const createFolder = async (
  folderName: string,
  parentFolderId: string | null = null,
): Promise<string | null> => {
  return addDocToCol('folders', { name: folderName, parentId: parentFolderId })
}

// 获取文件夹列表
export const getFolders = async (): Promise<DocumentData[]> => {
  return getFieldValues('folders', ['name', 'parentId'])
}

// 创建Note
export const createNote = async (folderId: string, note: DocumentData): Promise<string | null> => {
  note.folderId = folderId
  return addDocToCol('notes', note)
}

// 获取Note列表
export const getNotes = async (folderId: string): Promise<DocumentData[]> => {
  return getDocsByCondition('notes', { field: 'folderId', operator: '==', value: folderId })
}

// 创建Tag
export const createTag = async (tagName: string): Promise<string | null> => {
  return addDocToCol('tags', { name: tagName })
}

// 获取Tag列表
// export const getTags = async (): Promise<(DocumentData & Tag)[]> => {
//   return getFieldValues('tags', ['name', 'id'])
// }

// 创建组织
export const createOrg = async (orgName: string): Promise<string | null> => {
  return addDocToCol(COL_ORGANIZATIONS, { name: orgName })
}

export const getOrgs = () => getFieldValues(COL_ORGANIZATIONS, ['name', 'id'])

export type OrgMemberType = {
  orgId: string
  orgName: string
  userId: string
  role: string
  photoURL: string | null
}

// 添加成员到组织
export const addMemberToOrg = async (doc: OrgMemberType): Promise<string | null> => {
  return addDocToCol(COL_ORGMEMBERS, doc)
}

export const getJoinedOrgs = async (uid: string) => {
  return getDocsByCondition(COL_ORGMEMBERS, { field: 'userId', operator: '==', value: uid })
}
// 获取组织成员列表
export const getOrgMembers = async (orgId: string): Promise<DocumentData[]> => {
  return getDocsByCondition(COL_ORGMEMBERS, { field: 'orgId', operator: '==', value: orgId })
}
// 获取组织成员列表
export const getMembers = async (): Promise<DocumentData[]> => {
  return getDocsByCondition(COL_ORGMEMBERS)
}

// 获取已发布的文章列表
export const getPublishedNotes = async (): Promise<DocumentData[]> => {
  return getDocsByCondition('notes', { field: 'published', operator: '==', value: true })
}

// 获取已发布的文章列表
export const getRoles = async (): Promise<DocumentData[]> => {
  return getDocsByCondition(COL_ROLES, { field: 'roles', operator: '!=', value: null })
}
