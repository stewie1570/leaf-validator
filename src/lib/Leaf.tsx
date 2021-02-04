import React, { useState, useEffect, useRef, useMemo } from 'react'
import { get, set } from './domain'
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

async function validateWith<Target>({ validators, instance, location, targetValue, namespace }: Validate<Target>) {
    try {
        if (instance.validationModel && validators && validators.length) {
            const validationResults = (await Promise.all(validators.map(validator => validator(targetValue))))
                .filter(value => value)
                .flat();
            targetValue === instance.validationTarget && instance.validationModel.set((origValidationModel: any) => ({
                ...origValidationModel,
                [namespace]: {
                    ...(origValidationModel[namespace]),
                    [location]: validationResults
                }
            }));
        }
    } finally {
        instance && instance.validationModel && instance
            .validationModel
            .setNamespacesCurrentlyValidating(currentlyLoadingNamespaces => currentlyLoadingNamespaces
                .filter(currentNamespace => currentNamespace !== namespace));
    }
}

function findDefinedTargetIn<Target>(model: any, targets: Array<string>): Target {
    const value = get<Target>(targets[0]).from(model);
    return value !== undefined || targets.length <= 1
        ? value
        : findDefinedTargetIn(model, targets.slice(1));
}

export function Leaf<Model, Target>(props: {
    children: (
        model: Target,
        onChange: Update<Target>,
        onBlur: Blur,
        errors: Array<string>,
        parentLocation: string
    ) => any,
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
        const { validators, deferredValidators } = instance.current;

        instance.current && instance.current.validationModel && instance
            .current
            .validationModel
            .setNamespacesCurrentlyValidating(deferredValidators?.length
                ? ["non-deferred", "deferred"]
                : ["non-deferred"]);

        validateWith({
            validators,
            instance: instance.current,
            location,
            targetValue,
            namespace: "non-deferred"
        });
    }, [targetValue, location]);

    useDeferredEffect(() => {
        instance.current.validationTarget = targetValue;
        const { deferredValidators } = instance.current;

        validateWith({
            validators: deferredValidators,
            instance: instance.current,
            location,
            targetValue,
            namespace: "deferred"
        })
    }, deferMilliseconds || 500, [targetValue, location, deferMilliseconds]);

    const visibleErrors = useMemo(() => validationModel && (hasBlurred || showErrors)
        ? validationModel.get(location)
        : [], [validationModel, hasBlurred, showErrors, location]);

    return useMemo(() => children(
        targetValue,
        update => onChange(model => set(location).to(update).in(model)),
        () => setHasBlurred(true),
        visibleErrors,
        location
    ), [targetValue, location, visibleErrors, onChange, children]);
}