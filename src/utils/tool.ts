import { isNullOrUndefined } from "util";

interface Emptyable {
    isEmpty?(): boolean
}

interface IOptional<T> {
    readonly o: T | null;
    filter(method: (o: T) => boolean): IOptional<T>;
    map<R>(method: (o: T) => R): IOptional<R>;
    isEmpty(): boolean;
    get(): T;
    getOrDefault(d: T): T;
    getOrElse(method: () => T): T;
    then(method: (o: T) => void): void;
}

class Optional<T> implements IOptional<T> {
    o: T | null
    __chains: CallableFunction[] = []

    constructor(factor: T|null = null) {
        this.o = factor
    }
    static of<T>(factor: T): Optional<T> {
        if (isNullOrUndefined(factor)) {
            throw new Error("Can't be a null or undefined value.");
        }
        return new Optional(factor);
    }
    static ofNullable<T>(factor: T|null): Optional<T> {
        return new Optional(factor);
    }
    static empty(): Optional<never> {
        return new Optional();
    }
    filter(method: (o: T) => boolean): Optional<T> {
        if (isNullOrUndefined(this.o)) return this;
        return method(this.o) ? this : Optional.empty();
    }
    map<R>(method: (o: T) => R): Optional<R> {
        if (isNullOrUndefined(this.o)) return Optional.empty();
        const r = method(this.o);
        return isNullOrUndefined(r) ? Optional.empty() : Optional.of(r);
    }
    then(method: (o: T) => void) {
        if (isNullOrUndefined(this.o) || this.isEmpty()) throw new Error("value not resolved.");
        method(this.o);
    }
    isEmpty(): boolean {
        const emptyMethod = (<Emptyable>this.o).isEmpty;
        return isNullOrUndefined(this.o) || !isNullOrUndefined(emptyMethod) && emptyMethod();
    }
    get(): T {
        if (isNullOrUndefined(this.o)) throw new Error("factor is null or undefined.");
        return this.o;
    }
    getOrDefault(d: T): T {
        return this.isEmpty() ? d : <T>this.o;
    }
    getOrElse(method: () => T): T {
        if (!this.isEmpty()) return <T>this.o;
        const r = method();
        if (isNullOrUndefined(r)) throw new Error('getOrElse result of method can not a null or undefined value.')
        return r;
    }
}

export default Optional
