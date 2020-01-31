import React from 'react'
import { get, set } from './domain'

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