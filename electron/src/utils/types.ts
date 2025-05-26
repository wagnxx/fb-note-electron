export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type PartialWithRequiredId<T, ID extends keyof T> = Partial<T> & { [K in ID]: NonNullable<T[ID]> }
