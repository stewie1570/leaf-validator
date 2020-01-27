import React from 'react'
import { get, set } from './domain'

export function Model<TModel, TTarget>(props: {
    children: (model: TTarget, onChange: (updatedModel: TTarget) => void) => any,
    target: string,
    model: TModel,
    onChange: React.Dispatch<React.SetStateAction<TModel>>
}) {
    const { children, target, model, onChange } = props;

    return children(
        get<any>(target).from(model),
        update => onChange(set(target).to(update).in(model))
    );
}