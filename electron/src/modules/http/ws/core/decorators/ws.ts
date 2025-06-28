import 'reflect-metadata'

const ACTIONS_METADATA_KEY = Symbol('ws:actions')

export interface ActionMetadata {
  event: string
  methodName: string
}

export function action(event: string): MethodDecorator {
  return (target, propertyKey) => {
    const controllerClass = target.constructor
    const existing: ActionMetadata[] = Reflect.getMetadata(ACTIONS_METADATA_KEY, controllerClass) || []

    existing.push({
      event,
      methodName: propertyKey.toString(),
    })

    Reflect.defineMetadata(ACTIONS_METADATA_KEY, existing, controllerClass)
  }
}

export function getActionMetadata(instance: Object): ActionMetadata[] {
  return Reflect.getMetadata(ACTIONS_METADATA_KEY, instance.constructor) || []
}
