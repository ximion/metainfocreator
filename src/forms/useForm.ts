/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { reactive, computed, ref, type ComputedRef, type Ref } from 'vue';

/**
 * A small form helper: per-field validators, dirty and touched tracking, and an
 * ordered submit gate that reports one problem at a time.
 *
 * A field has two ways to be written, and only one of them marks it dirty:
 *
 *   f.someField.value = x   bound with v-model, i.e. the user typed  -> dirty
 *   f.someField.set(x)      filled in on the user's behalf           -> not dirty
 *
 * The distinction is what lets guessed values keep updating until the user
 * takes the field over, and stop for good afterwards. `values` is exposed
 * read-only, so binding v-model straight to it - which would slip past the
 * dirty tracking - does not type-check.
 */

/** A validator returns null when the value is acceptable, otherwise a
 *  single-key record naming the error. The key is what templates test. */
export type Validator = (value: unknown) => FieldErrors | null;

export interface ValidationError {
    value?: string;
}
export type FieldErrors = Record<string, ValidationError>;

export interface FieldSpec<T = unknown> {
    initial: T;
    /** Human-readable name used by the submit gate's message. */
    label?: string;
    validators?: Validator[];
    /** Submit gate: tolerate an empty value. */
    allowEmpty?: boolean;
    /**
     * Whether the field currently takes part at all. An inactive field never
     * reports errors and is skipped by the submit gate, which is how the forms
     * switch between alternative sets of required fields.
     *
     * The current values are handed in rather than read from the form: a spec
     * that closed over the form being built would make its own type inference
     * circular, and TypeScript resolves that by falling back to `any` - which
     * quietly costs `values` both its element types and its readonly-ness.
     */
    active?: (values: Record<string, unknown>) => boolean;
}

export interface Field<T = unknown> {
    readonly name: string;
    /** v-model target. Assigning marks the field dirty. */
    value: T;
    /** Write a value without marking the field dirty, for values the app
     *  fills in on the user's behalf. */
    set: (value: T) => void;
    readonly errors: FieldErrors;
    readonly invalid: boolean;
    readonly valid: boolean;
    readonly dirty: boolean;
    readonly touched: boolean;
    readonly active: boolean;
    /** invalid && (dirty || touched) - when inline hints should be shown. */
    readonly showErrors: boolean;
    touch: () => void;
}

type Specs = Record<string, FieldSpec>;
type ValuesOf<S extends Specs> = { [K in keyof S]: S[K]['initial'] };
type FieldsOf<S extends Specs> = { [K in keyof S]: Field<S[K]['initial']> };

export interface Form<S extends Specs> {
    /** Read-only view of the current values, for generate() and watchers. */
    values: Readonly<ValuesOf<S>>;
    /** Field accessors - what templates bind to. */
    f: FieldsOf<S>;
    /** The single submit-gate message, or null. */
    error: Ref<string | null>;
    /** Set the submit-gate message directly (for cross-field checks). */
    fail(message: string): void;
    /** One step of the ordered gate: mark touched, check empty, check validity. */
    validateField(field: Field, label?: string): boolean;
}

export function useForm<S extends Specs>(specs: S): Form<S> {
    const values = reactive({}) as ValuesOf<S>;
    const dirty = reactive({}) as Record<string, boolean>;
    const touched = reactive({}) as Record<string, boolean>;
    const errorsOf: Record<string, ComputedRef<FieldErrors>> = {};
    const f = {} as FieldsOf<S>;
    const error = ref<string | null>(null);

    for (const name of Object.keys(specs)) {
        const spec = specs[name];
        (values as Record<string, unknown>)[name] = spec.initial;
        dirty[name] = false;
        touched[name] = false;

        const isActive = () => (spec.active ? spec.active(values as Record<string, unknown>) : true);

        errorsOf[name] = computed<FieldErrors>(() => {
            if (!isActive())
                return {};
            const out: FieldErrors = {};
            for (const validate of spec.validators ?? []) {
                const res = validate((values as Record<string, unknown>)[name]);
                if (res)
                    Object.assign(out, res);
            }
            return out;
        });

        (f as Record<string, Field>)[name] = {
            name,
            get value() { return (values as Record<string, unknown>)[name]; },
            set value(v: unknown) {
                (values as Record<string, unknown>)[name] = v;
                dirty[name] = true;
            },
            set: (v: unknown) => { (values as Record<string, unknown>)[name] = v; },
            get errors() { return errorsOf[name].value; },
            get invalid() { return Object.keys(errorsOf[name].value).length > 0; },
            get valid() { return Object.keys(errorsOf[name].value).length === 0; },
            get dirty() { return dirty[name]; },
            get touched() { return touched[name]; },
            get active() { return isActive(); },
            get showErrors() {
                return Object.keys(errorsOf[name].value).length > 0 && (dirty[name] || touched[name]);
            },
            touch: () => { touched[name] = true; },
        };
    }

    function fail(message: string) {
        error.value = message;
    }

    function validateField(field: Field, label?: string): boolean {
        field.touch();

        const spec = specs[field.name];
        const name = label ?? spec.label ?? field.name;
        const value = field.value;

        if (!spec.allowEmpty) {
            if (!value || (typeof value === 'string' && !value.trim())) {
                fail(`No value set for ${name}!`);
                return false;
            }
        }

        if (field.invalid) {
            fail(`Value for ${name} is invalid!`);
            return false;
        }
        return true;
    }

    return { values: values as Readonly<ValuesOf<S>>, f, error, fail, validateField };
}
