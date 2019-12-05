import { ifElse, map } from 'ramda'
import { isNullOrUndefined } from 'util'

interface Emptyable {
    isEmpty?: () => boolean
}

interface IOptional<T> {
    readonly o: T | null
    filter(method: (o: NonNullable<T>) => boolean): IOptional<T>
    map<R>(method: (o: NonNullable<T>) => R): IOptional<R>
    isEmpty(): boolean
    flatMap<R>(method: (o: NonNullable<T>) => IOptional<R>): IOptional<R>
    get(): T
    getOrDefault(d: T): T
    getOrElse(method: () => T): T
    then(method: (o: T) => void): void
    thenOrElse(thenMethod: (o: T) => void, elseMethod: () => void): void
}

class Optional<T> implements IOptional<T> {
    public static of<T>(factor: T): Optional<T> {
        return new Optional(factor)
    }
    public static empty(): Optional<null> {
        return new Optional(null)
    }
    public o: T

    private constructor(factor: T) {
        this.o = factor
    }

    public filter(method: (o: NonNullable<T>) => boolean): Optional<T|null> {
        if (isNullOrUndefined(this.o)) { return this }
        return method(this.o as NonNullable<T>) ? this : Optional.empty()
    }

    public map<R>(method: (o: NonNullable<T>) => R): Optional<R|null> {
        if (isNullOrUndefined(this.o)) { return Optional.empty() }
        const r = method(this.o as NonNullable<T>)
        return isNullOrUndefined(r) ? Optional.empty() : Optional.of(r as NonNullable<R>)
    }
    public flatMap<R>(method: (o: NonNullable<T>) => Optional<R>): Optional<R|null> {
        if (isNullOrUndefined(this.o)) { return Optional.empty() }
        const r = method(this.o as NonNullable<T>)
        return isNullOrUndefined(r) ? Optional.empty() : r
    }
    public thenOrElse(thenMethod: (o: NonNullable<T>) => void, elseMethod: () => void) {
        if (isNullOrUndefined(this.o) || this.isEmpty()) {
            elseMethod()
        } else {
            thenMethod(this.o as NonNullable<T>)
        }
    }
    public then(method: (o: NonNullable<T>) => void) {
        if (isNullOrUndefined(this.o) || this.isEmpty()) { return }
        method(this.o as NonNullable<T>)
    }
    public isEmpty(): boolean {
        if (isNullOrUndefined(this.o)) { return true }
        const emptyMethod = (this.o as Emptyable).isEmpty
        return !isNullOrUndefined(emptyMethod) && emptyMethod.call(this.o)
    }
    // not pure function
    public get(): NonNullable<T> {
        if (this.isEmpty()) { throw new Error('factor is null or undefined.') }
        return this.o as NonNullable<T>
    }
    public getOrDefault(d: NonNullable<T>): NonNullable<T> {
        return this.isEmpty() ? d : this.o as NonNullable<T>
    }
    // not pure function
    public getOrElse(method: () => NonNullable<T>): NonNullable<T> {
        if (!this.isEmpty()) { return this.o as NonNullable<T> }
        const r = method()
        if (isNullOrUndefined(r)) { throw new Error('getOrElse result of method can not a null or undefined value.') }
        return r
    }
}

// ===========================
// pure programming function block

/**
 * mapOpt is a Optional version of map(fn, Fucntor)
 * @param fn mapped function
 */
export function mapOpt<K, U>(fn: (t: K) => U): (obj: Optional<K|null>) => Optional<U|null> {
    return obj => map(fn, obj) as Optional<U>
}

export function safeGet<U>(defaultValue: NonNullable<U>): (obj: Optional<U|null>) => U {
    return obj => obj.getOrDefault(defaultValue)
}

export default Optional
