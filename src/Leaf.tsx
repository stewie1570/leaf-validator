import React, { useState, useEffect } from 'react'
import { get, set } from './domain'

type Validator = (value: any) => Array<string> | any;
type Update<TTarget> = (updatedModel: TTarget) => void;
type Blur = () => void;
type ValidationModel = {
    set: React.Dispatch<any>,
    get: (target: string) => Array<string>
};

export function useValidationFor(model: any): ValidationModel {
    const [validationModel, setValidationModel] = useState<any>({});

    return {
        set: setValidationModel,
        get: (target: string) => validationModel[target] || []
    }
}

export function Leaf<TModel, TTarget>(props: {
    children: (model: TTarget, onChange: Update<TTarget>, onBlur: Blur, errors: Array<string>) => any,
    location: string,
    model: TModel,
    onChange: React.Dispatch<React.SetStateAction<TModel>>,
    validationModel?: ValidationModel,
    validators?: Array<Validator>,
    showErrors?: boolean
}) {
    const [hasBlurred, setHasBlurred] = useState(false);
    const { children, location, model, validationModel, validators, onChange, showErrors } = props;
    const targetValue = get<any>(location).from(model);

    useEffect(() => {
        if (validationModel && validators && validators.length) {
            validationModel.set((origValidationModel: any) => ({
                ...origValidationModel,
                [location]: validators
                    .map(validator => validator(targetValue))
                    .filter(value => value)
                    .flat()
            }));
        }
    }, [targetValue]);

    return children(
        targetValue,
        update => onChange(set(location).to(update).in(model)),
        () => setHasBlurred(true),
        validationModel && (hasBlurred || showErrors) ? validationModel.get(location) : []
    );
}