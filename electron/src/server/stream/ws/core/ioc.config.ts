export { injectable, inject, Container } from 'inversify'
export { TYPES } from './types'
export { provide, buildProviderModule } from './inversify-decorators'

// import { fluentProvide, buildProviderModule } from 'inversify-binding-decorators' // 废弃！

// const provideThrowable = function (identity: symbol | string, name: string) {
//   return fluentProvide(identity).whenTargetNamed(name).done()
// }
