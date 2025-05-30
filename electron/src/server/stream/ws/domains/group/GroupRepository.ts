// domains/group/GroupRepository.ts
import { inject, injectable, TYPES } from '../../core/ioc.config'
import { Group } from './group'
// @injectable()
export class GroupRepository {
  private groups = new Map<string, Group>()

  get(id: string) {
    return this.groups.get(id)
  }

  save(group: Group) {
    this.groups.set(group.id, group)
  }

  exists(id: string) {
    return this.groups.has(id)
  }

  getGroups(ids: string[]) {
    const groups = ids.map(id => this.get(id)).filter(Boolean) as Group[]
    return groups
  }

  getAll(): Group[] {
    return Array.from(this.groups.values())
  }

  init(groups: Group[]) {
    for (const group of groups) {
      this.save(group)
    }
  }

  clear() {
    this.groups.clear()
  }
}
