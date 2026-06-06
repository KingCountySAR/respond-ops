declare module '*.jpg' { const src: string; export default src }

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
type OptionalId<T> = Optional<T, 'id'>
