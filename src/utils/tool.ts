import { isNullOrUndefined } from "util";

interface Emptyable {
    isEmpty?: () => boolean
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

    constructor(factor: T | null = null) {
        this.o = factor
    }
    static of<T>(factor: NonNullable<T>): Optional<T> {
        if (isNullOrUndefined(factor)) {
            throw new Error("Can't be a null or undefined value.");
        }
        return new Optional(factor);
    }
    static ofNullable<T>(factor: T): Optional<T> {
        return new Optional(factor);
    }
    static empty(): Optional<never> {
        return new Optional();
    }
    filter(method: (o: NonNullable<T>) => boolean): Optional<T> {
        if (isNullOrUndefined(this.o)) return this;
        return method(<NonNullable<T>>this.o) ? this : Optional.empty();
    }
    map<R>(method: (o: NonNullable<T>) => R): Optional<R> {
        if (isNullOrUndefined(this.o)) return Optional.empty();
        const r = method(<NonNullable<T>>this.o);
        return isNullOrUndefined(r) ? Optional.empty() : Optional.of(<NonNullable<R>>r);
    }
    then(method: (o: NonNullable<T>) => void) {
        if (isNullOrUndefined(this.o) || this.isEmpty()) return;
        method(<NonNullable<T>>this.o);
    }
    isEmpty(): boolean {
        if (isNullOrUndefined(this.o)) return true;
        const emptyMethod = (<Emptyable>this.o).isEmpty;
        return !isNullOrUndefined(emptyMethod) && emptyMethod();
    }
    get(): T {
        if (this.isEmpty()) throw new Error("factor is null or undefined.");
        return <T>this.o;
    }
    getOrDefault(d: NonNullable<T>): NonNullable<T> {
        return this.isEmpty() ? d : <NonNullable<T>>this.o;
    }
    getOrElse(method: () => NonNullable<T>): NonNullable<T> {
        if (!this.isEmpty()) return <NonNullable<T>>this.o;
        const r = method();
        if (isNullOrUndefined(r)) throw new Error('getOrElse result of method can not a null or undefined value.')
        return r;
    }
}

export default Optional
