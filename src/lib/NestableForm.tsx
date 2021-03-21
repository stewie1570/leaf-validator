import React, { useEffect, useRef, useState } from "react";
import { createContext, useContext } from "react";
import { useMountedOnlyState } from "./hooks/useMountedOnlyState";

type CurrentFormId = string | undefined;
type CurrentForm = [
    CurrentFormId,
    React.Dispatch<React.SetStateAction<CurrentFormId>>,
    (name: string, handler: (event?: React.FormEvent<HTMLFormElement>) => void) => void
];
type Form = {
    children: any,
    name: string,
    onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void,
    [otherPropNames: string]: any
};

const CurrentFormContext = createContext<CurrentForm | undefined>(undefined);
const FormIdContext = createContext<any>(undefined);

export const inputWithFormSelectionOnFocus = (Input: React.ElementType) => (props: any) => {
    const { onFocus, ...otherProps } = props;
    const formId = useContext(FormIdContext);
    const [, setCurrentFormId] = useContext(CurrentFormContext) ?? [undefined, () => undefined];

    const handleFocus = (...args: any) => {
        setCurrentFormId(formId);
        onFocus?.(...args);
    }

    return <Input {...otherProps} onFocus={handleFocus} />;
}

export const formWithVirtualNestability = (Form: React.ElementType) => ({ children, name, onSubmit, ...otherProps }: Form) => {
    const [submitHandlers, setSubmitHandlers] = useState({
        [name]: onSubmit
    });
    const addHandler = (name: string, handler: any) => {
        setSubmitHandlers(submitHandlers => ({
            ...submitHandlers,
            [name]: handler
        }));
    }
    const currentFormContext = useContext(CurrentFormContext);
    const [selectedHandlerName, , setHandler] = currentFormContext ?? [name, undefined, addHandler];
    const [localFormName, setLocalFormName] = useMountedOnlyState<CurrentFormId>(name);
    const isInsideForm = Boolean(currentFormContext);

    useEffect(() => {
        isInsideForm && setHandler?.(name, onSubmit);
    }, []);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        localFormName && submitHandlers[localFormName]?.(event);
    }

    return <FormIdContext.Provider value={name}>
        {
            isInsideForm
                ? children
                : <CurrentFormContext.Provider value={[localFormName, setLocalFormName, addHandler]}>
                    <Form {...otherProps} onSubmit={handleSubmit} name={name} >
                        {children}
                    </Form>
                </CurrentFormContext.Provider>
        }
    </FormIdContext.Provider>
};
