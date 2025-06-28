// domains/group/GroupRepository.ts

import { Group } from '../../domains/group/group'

export interface IGroupRepository {
  get(id: string): Group | undefined
  save(group: Group): void
  exists(id: string): boolean
  getGroups(ids: string[]): Group[]
  getAll(): Group[]
  init(groups: Group[]): void
  clear(): void
}
