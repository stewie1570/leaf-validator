import React, { useState, useEffect, useRef } from 'react'
import { get, set, isValidating } from './domain'
import { ValidationModel } from './models';
import { useDeferredEffect } from './hooks/useDeferredEffect'

type Validator<T> = (value: T) => Array<string> | any;
type Update<TTarget> = (updatedModel: TTarget) => void;
type Blur = () => void;

type Instance<Target> = {
    validationModel?: ValidationModel
    validators?: Array<Validator<Target>>,
    deferredValidators?: Array<Validator<Target>>,
    validationTarget?: Target,
    deferrmentTimeout?: any
};

type Validate<Target> = {
    validators: Validator<Target>[] | undefined,
    instance: Instance<Target>,
    location: string,
    targetValue: Target,
    namespace: string
}

const isPromise = (value: any) => typeof value?.then === "function";

async function validateWith<Target>({ validators, instance, location, targetValue, namespace }: Validate<Target>) {
    if (instance.validationModel && validators && validators.length) {
        const results = validators.map(validator => validator(targetValue));

        const setResults = (validationsResults: any) => targetValue === instance.validationTarget
            && instance.validationModel
            && instance.validationModel.set((origValidationModel: any) => ({
                ...origValidationModel,
                [namespace]: {
                    ...(origValidationModel[namespace]),
                    [location]: validationsResults
                }
            }));

        const unResolvedResults = results
            .map(result => isPromise(result) ? isValidating : result)
            .filter(value => value)
            .flat();
        setResults(unResolvedResults);

        const resolvedResults = (await Promise.all(results))
            .filter(value => value)
            .flat();
        setResults(resolvedResults);
    }
}

function findDefinedTargetIn<Target>(model: any, targets: Array<string>): Target {
    const value = get<Target>(targets[0]).from(model);
    return value !== undefined || targets.length <= 1
        ? value
        : findDefinedTargetIn(model, targets.slice(1));
}

const deferredNamespace = "deferred";
const nonDeferredNamespace = "non-deferred";

export function Leaf<Model, Target>(props: {
    children: (model: Target, onChange: Update<Target>, onBlur: Blur, errors: Array<string>) => any,
    location: string,
    model: Model,
    onChange: React.Dispatch<React.SetStateAction<Model>>,
    validationModel?: ValidationModel,
    validators?: Array<Validator<Target>>,
    deferredValidators?: Array<Validator<Target>>,
    deferMilliseconds?: number,
    showErrors?: boolean,
    failOverLocations?: Array<string>
}) {
    const [hasBlurred, setHasBlurred] = useState(false);
    const {
        children,
        location,
        model,
        validationModel,
        validators,
        deferredValidators,
        deferMilliseconds,
        onChange,
        showErrors
    } = props;
    const instance = useRef<Instance<Target>>({
        validationModel,
        validators,
        deferredValidators
    });
    const preferredTargetValue = get<Target>(location).from(model);
    const targetValue = preferredTargetValue === undefined
        ? findDefinedTargetIn<Target>(model, props.failOverLocations || [])
        : preferredTargetValue;

    useEffect(() => {
        instance.current.validationTarget = targetValue;
        const { validators } = instance.current;

        validateWith({
            validators,
            instance: instance.current,
            location,
            targetValue,
            namespace: nonDeferredNamespace
        });
    }, [targetValue, location]);

    useEffect(() => {
        instance.current.validationTarget = targetValue;
        instance?.current?.validationModel && instance.current.validationModel.set((origValidationModel: any) => ({
            ...origValidationModel,
            [deferredNamespace]: {
                ...(origValidationModel[deferredNamespace]),
                [location]: [isValidating]
            }
        }));
    }, [targetValue, location, deferMilliseconds]);

    useDeferredEffect(() => {
        instance.current.validationTarget = targetValue;
        const { deferredValidators } = instance.current;

        const namespace = "deferred";
        instance?.current?.validationModel && instance.current.validationModel.set((origValidationModel: any) => ({
            ...origValidationModel,
            [namespace]: {
                ...(origValidationModel[namespace]),
                [location]: isValidating
            }
        }))
        validateWith({
            validators: deferredValidators,
            instance: instance.current,
            location,
            targetValue,
            namespace
        })
    }, deferMilliseconds || 500, [targetValue, location, deferMilliseconds]);

    return children(
        targetValue,
        update => onChange(set(location).to(update).in(model)),
        () => setHasBlurred(true),
        validationModel && (hasBlurred || showErrors) ? validationModel.get(location) : []
    );
}