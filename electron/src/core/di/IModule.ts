export interface IModule {
  start(): Promise<void> | void
  stop?(): Promise<void> | void
  restart?(): Promise<void>
}
