import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
    failOverLocations?: Array<string>,
    useFunctionalSetter?: boolean
}) {
    const [hasBlurred, setHasBlurred] = useState(false);
    
    const { location, model, onChange } = props;
    
    const propsRef = useRef({
        validationModel: props.validationModel,
        validators: props.validators,
        deferredValidators: props.deferredValidators,
        deferMilliseconds: props.deferMilliseconds,
        showErrors: props.showErrors,
        useFunctionalSetter: props.useFunctionalSetter
    });
    
    useEffect(() => {
        propsRef.current = {
            validationModel: props.validationModel,
            validators: props.validators,
            deferredValidators: props.deferredValidators,
            deferMilliseconds: props.deferMilliseconds,
            showErrors: props.showErrors,
            useFunctionalSetter: props.useFunctionalSetter
        };
    }, [
        props.validationModel,
        props.validators,
        props.deferredValidators,
        props.deferMilliseconds,
        props.showErrors,
        props.useFunctionalSetter
    ]);
    
    const targetValue = useMemo(() => {
        const preferredTargetValue = get<Target>(props.location).from(props.model);
        return preferredTargetValue === undefined
            ? findDefinedTargetIn<Target>(props.model, props.failOverLocations || [])
            : preferredTargetValue;
    }, [props.model, props.location, props.failOverLocations]);
    
    const instance = useRef<Instance<Target>>({
        validationModel: props.validationModel,
        validators: props.validators,
        deferredValidators: props.deferredValidators
    });
    
    instance.current = {
        validationModel: props.validationModel,
        validators: props.validators,
        deferredValidators: props.deferredValidators
    };

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
            location: props.location,
            targetValue,
            namespace: "non-deferred"
        });
    }, [targetValue, props.location]);

    useEffect(() => {
        return () => {
            instance
                .current
                .validationModel
                ?.set((origValidationModel: any) => {
                    const { [props.location]: removedDeferred, ...nonDeferredWithoutLocation } = origValidationModel.deferred || {};
                    const { [props.location]: removedNonDeferred, ...deferredWithoutLocation } = origValidationModel['non-deferred'] || {};
                    const result = {
                        ...origValidationModel,
                        deferred: deferredWithoutLocation,
                        'non-deferred': nonDeferredWithoutLocation
                    };
                    return result;
                });
        }
    }, [props.location]);

    useDeferredEffect(() => {
        instance.current.validationTarget = targetValue;
        const { deferredValidators } = instance.current;

        validateWith({
            validators: deferredValidators,
            instance: instance.current,
            location: props.location,
            targetValue,
            namespace: "deferred"
        })
    }, propsRef.current.deferMilliseconds || 500, [targetValue, props.location]);

    const handleChange = useCallback((update: Target) => {
        onChange(currentModel => 
            propsRef.current.useFunctionalSetter
                ? set(location).to(update).in(currentModel)
                : set(location).to(update).in(model)
        );
    }, [location, model, onChange, propsRef]);

    const handleBlur = useCallback(() => {
        setHasBlurred(true);
    }, []);

    const errors = useMemo(() => {
        return props.validationModel && (hasBlurred || propsRef.current.showErrors) 
            ? props.validationModel.get(props.location) 
            : [];
    }, [props.validationModel, hasBlurred, props.location]);

    return props.children(
        targetValue,
        handleChange,
        handleBlur,
        errors,
        props.location
    );
}