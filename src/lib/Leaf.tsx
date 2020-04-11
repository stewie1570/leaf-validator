import React, { useState, useEffect, useRef } from 'react'
import { get, set } from './domain'

type Validator<T> = (value: T) => Array<string> | any;
type Update<TTarget> = (updatedModel: TTarget) => void;
type Blur = () => void;
type Error = {
    location: string;
    messages: Array<string>;
};

type ValidationModel = {
    set: React.Dispatch<any>,
    get: (location: string) => Array<string>,
    getAllErrorsForLocation: (location: string) => Array<Error>
};

type FilteredObjectOptions<T> = {
    keyFilter: (key: string) => boolean,
    mapper: (key: string, value: any) => T
}

type Instance<Target> = {
    validationModel?: ValidationModel
    validators?: Array<Validator<Target>>,
    deferredValidators?: Array<Validator<Target>>,
    validationTarget?: Target,
    deferrmentTimeout?: any
};

function filteredObjectToArray<T>(obj: any, options: FilteredObjectOptions<T>): Array<T> {
    return Object
        .keys(obj)
        .filter(options.keyFilter)
        .map(key => options.mapper(key, obj[key]));
}

export function useValidationModel(): ValidationModel {
    const [validationModel, setValidationModel] = useState<any>({});

    return {
        set: setValidationModel,
        get: (location: string) => validationModel[location] || [],
        getAllErrorsForLocation: location => filteredObjectToArray(validationModel,
            {
                keyFilter: key => key.startsWith(location),
                mapper: (key, value) => ({ location: key, messages: value })
            })
            .filter(error => error?.messages?.length)
    }
}

export function Leaf<Model, Target>(props: {
    children: (model: Target, onChange: Update<Target>, onBlur: Blur, errors: Array<string>) => any,
    location: string,
    model: Model,
    onChange: React.Dispatch<React.SetStateAction<Model>>,
    validationModel?: ValidationModel,
    validators?: Array<Validator<Target>>,
    deferredValidators?: Array<Validator<Target>>,
    deferMilliseconds?: number,
    showErrors?: boolean
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
    const targetValue = get<Target>(location).from(model);

    useEffect(() => {

        async function validateWith(validationModel: ValidationModel | undefined, validators: Validator<Target>[] | undefined) {
            if (validationModel && validators && validators.length) {
                const validationResults = (await Promise.all(validators.map(validator => validator(targetValue))))
                    .filter(value => value)
                    .flat();
                targetValue === instance.current.validationTarget && validationModel.set((origValidationModel: any) => ({
                    ...origValidationModel,
                    [location]: validationResults
                }));
            }
        }
        
        const runValidation = async () => {
            const { validationModel, validators } = instance.current
            await validateWith(validationModel, validators);
        };

        const queueDeferredValidation = () => {
            const { validationModel, deferredValidators } = instance.current
            instance.current.deferrmentTimeout && clearTimeout(instance.current.deferrmentTimeout);
            instance.current.deferrmentTimeout = setTimeout(
                () => validateWith(validationModel, deferredValidators),
                deferMilliseconds || 500);
        };

        instance.current.validationTarget = targetValue;
        runValidation();
        queueDeferredValidation();
    }, [targetValue, location, deferMilliseconds]);

    return children(
        targetValue,
        update => onChange(set(location).to(update).in(model)),
        () => setHasBlurred(true),
        validationModel && (hasBlurred || showErrors) ? validationModel.get(location) : []
    );
}