import { addDocToCol, deleteDocsByIds, getDocData, getFieldValues } from '@/firebase/db'
import { auth } from '@/firebase/authService'
import { FieldValue, orderBy, serverTimestamp, where } from 'firebase/firestore'

const COL_ARTICLES = 'articles'

export type InputDocType = {
  title: string
  content: string
  tags?: string[]
  published?: boolean // if draft ? false : true
  createTime?: FieldValue
  createId?: string
}

export const createNote = (doc: InputDocType) => {
  doc.createTime = serverTimestamp()
  if (auth?.currentUser?.uid) {
    doc.createId = auth.currentUser.uid
    return addDocToCol(COL_ARTICLES, doc)
  }
  return Promise.reject('logout')
}

export const getAllNotes = () => {
  if (!auth?.currentUser?.uid) {
    return Promise.reject('logout')
  }
  return getFieldValues(
    COL_ARTICLES,
    ['title', 'id', 'createTime', 'published'],
    [
      where('createId', '==', auth.currentUser.uid),
      // where('published', 'in', [status === true ? true ? status === false ? false : ...[true , false] ]),
      // where('tags', 'not-in', ['']),
      where('content', '>', ''),
      where('title', '>', ''),
      orderBy('createTime', 'desc'),
    ],
  )
}

export const getNote = (id: string) => getDocData(COL_ARTICLES, id)

export const getAllPublishedNotes = () => {
  return getFieldValues(
    COL_ARTICLES,
    ['title', 'id', 'createTime', 'createId'],
    [
      where('content', '>', ''),
      where('title', '>', ''),
      where('title', '>', ''),
      where('published', '==', true),
      orderBy('createTime', 'asc'),
    ],
  )
}

export const deleteNotes = (ids: string[]) => deleteDocsByIds(COL_ARTICLES, ids)
