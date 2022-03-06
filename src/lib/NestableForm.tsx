import React, { forwardRef, useEffect, useState } from "react";
import { createContext, useContext } from "react";
import { useMountedOnlyState } from "./hooks/useMountedOnlyState";

type CurrentFormId = string | undefined;
type CurrentForm = [
    CurrentFormId,
    React.Dispatch<React.SetStateAction<CurrentFormId>>,
    React.Dispatch<React.SetStateAction<{
        [x: string]: (event?: React.FormEvent<HTMLFormElement> | undefined) => void;
    }>>
];
type NestableFormInputHOC = <P>(Input: React.ComponentType<P>) => React.ComponentType<P>;
type NestableFormSubmitButtonHOC = <P>(Button: React.ComponentType<P>) => React.ComponentType<P>;
type NestableFormHOC = <P>(Form: React.ComponentType<P>) => React.ComponentType<P>;

const CurrentFormContext = createContext<CurrentForm | undefined>(undefined);
const FormIdContext = createContext<any>(undefined);

export const submitButtonWithFormSelectionOnClick: NestableFormSubmitButtonHOC = Button => forwardRef((props: any, ref) => {
    const [currentFormId] = useContext(CurrentFormContext) ?? [undefined];
    const formId = useContext(FormIdContext);
    const isActiveSubmitButton = currentFormId === formId;

    return <Button {...props} type={isActiveSubmitButton ? "submit" : "button"} ref={ref} />;
});

export const inputWithFormSelectionOnFocus: NestableFormInputHOC = Input => forwardRef((props: any, ref) => {
    const { onFocus, ...otherProps } = props;
    const formId = useContext(FormIdContext);
    const [, setCurrentFormId] = useContext(CurrentFormContext) ?? [undefined, () => undefined];

    const handleFocus = (...args: any) => {
        setCurrentFormId(formId);
        onFocus?.(...args);
    }

    return <Input {...otherProps} ref={ref} onFocus={handleFocus} />;
});

export const formWithVirtualNestability: NestableFormHOC = Form => (props: any) => {
    const { children, name, onSubmit, ...otherProps } = props;
    const [submitHandlers, setSubmitHandlers] = useState<{ [name: string]: any }>({
        [name]: onSubmit
    });
    const currentFormContext = useContext(CurrentFormContext);
    const [, , setHandlers] = currentFormContext ?? [name, undefined, undefined];
    const [localFormName, setLocalFormName] = useMountedOnlyState<CurrentFormId>(name);
    const isInsideForm = Boolean(currentFormContext);

    useEffect(() => {
        isInsideForm && setHandlers?.(submitHandlers => ({
            ...submitHandlers,
            [name]: onSubmit
        }));
    }, [isInsideForm, name, onSubmit, setHandlers]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        localFormName && submitHandlers[localFormName]?.(event);
    }

    return <FormIdContext.Provider value={name}>
        {
            isInsideForm
                ? children
                : <CurrentFormContext.Provider value={[localFormName, setLocalFormName, setSubmitHandlers]}>
                    <Form {...otherProps} onSubmit={handleSubmit} name={name}>
                        {children}
                    </Form>
                </CurrentFormContext.Provider>
        }
    </FormIdContext.Provider>
};
