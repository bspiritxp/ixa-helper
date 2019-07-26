import { isNullOrUndefined } from "util";

interface Emptyable {
    isEmpty?: () => boolean;
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
    public static of<T>(factor: NonNullable<T>): Optional<T> {
        if (isNullOrUndefined(factor)) {
            throw new Error("Can't be a null or undefined value.");
        }
        return new Optional(factor);
    }
    public static ofNullable<T>(factor: T): Optional<T> {
        return new Optional(factor);
    }
    public static empty(): Optional<never> {
        return new Optional();
    }
    public o: T | null;

    constructor(factor: T | null = null) {
        this.o = factor;
    }
    public filter(method: (o: NonNullable<T>) => boolean): Optional<T> {
        if (isNullOrUndefined(this.o)) { return this; }
        return method(this.o as NonNullable<T>) ? this : Optional.empty();
    }
    public map<R>(method: (o: NonNullable<T>) => R): Optional<R> {
        if (isNullOrUndefined(this.o)) { return Optional.empty(); }
        try {
            const r = method(this.o as NonNullable<T>);
            return isNullOrUndefined(r) ? Optional.empty() : Optional.of(r as NonNullable<R>);
        } catch (err) {
            // tslint:disable-next-line:no-console
            console.warn(err);
        }
        return Optional.empty();
    }
    public thenOrElse(thenMethod: (o: NonNullable<T>) => void, elseMethod: () => void) {
        if (isNullOrUndefined(this.o) || this.isEmpty()) {
            elseMethod();
        } else {
            thenMethod(this.o as NonNullable<T>);
        }
    }
    public then(method: (o: NonNullable<T>) => void) {
        if (isNullOrUndefined(this.o) || this.isEmpty()) { return; }
        method(this.o as NonNullable<T>);
    }
    public isEmpty(): boolean {
        if (isNullOrUndefined(this.o)) { return true; }
        const emptyMethod = (this.o as Emptyable).isEmpty;
        return !isNullOrUndefined(emptyMethod) && emptyMethod();
    }
    public get(): NonNullable<T> {
        if (this.isEmpty()) { throw new Error("factor is null or undefined."); }
        return this.o as NonNullable<T>;
    }
    public getOrDefault(d: NonNullable<T>): NonNullable<T> {
        return this.isEmpty() ? d : this.o as NonNullable<T>;
    }
    public getOrElse(method: () => NonNullable<T>): NonNullable<T> {
        if (!this.isEmpty()) { return this.o as NonNullable<T>; }
        const r = method();
        if (isNullOrUndefined(r)) { throw new Error('getOrElse result of method can not a null or undefined value.'); }
        return r;
    }
}

export default Optional;
