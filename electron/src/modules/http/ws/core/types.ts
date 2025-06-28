// core/types.ts
export const TYPES = {
  // Repositories
  UserRepository: Symbol('UserRepository'),
  GroupRepository: Symbol('GroupRepository'),
  MessageRepository: Symbol('MessageRepository'),

  // Services
  UserService: Symbol('UserService'),
  UserGroupService: Symbol('UserGroupService'),
  GroupService: Symbol('GroupService'),
  MessageService: Symbol('MessageService'),

  MessageDispatcher: Symbol('MessageDispatcher'),
  CoordinatorService: Symbol('CoordinatorService'),
  WebSocketManager: Symbol('WebSocketManager'),
  WebSocketNotifier: Symbol('WebSocketNotifier'),

  // Controllers
  GroupController: Symbol('GroupController'),
}
