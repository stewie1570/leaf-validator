import React, { useState } from 'react'
import { get, set } from './domain'

type Validator = (value: any) => Array<string> | any;

export function useValidationFor(model: any) {
    const [validationModel, setValidationModel] = useState<any>({});

    return {
        validate: (target: string) => ({
            conformsTo: (validator: Validator) => {
                setValidationModel((currentValidationModel: any) => ({
                    ...currentValidationModel,
                    [target]: validator(get(target).from(model))
                }));
            }
        }),
        validationResultsFor: (target: string) => validationModel[target] || []
    }
}

export function Leaf<TModel, TTarget>(props: {
    children: (model: TTarget, onChange: (updatedModel: TTarget) => void) => any,
    location: string,
    model: TModel,
    onChange: React.Dispatch<React.SetStateAction<TModel>>
}) {
    const { children, location, model, onChange } = props;

    return children(
        get<any>(location).from(model),
        update => onChange(set(location).to(update).in(model))
    );
}