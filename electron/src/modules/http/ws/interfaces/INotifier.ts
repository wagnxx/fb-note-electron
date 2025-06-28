// domains/interfaces/INotifier.ts
export interface INotifier {
  notifyGroup(groupId: string, message: unknown): Promise<void>
}
