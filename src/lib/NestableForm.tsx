import React, { useRef } from "react";
import { createContext, useContext } from "react";
import { useMountedOnlyState } from "./hooks/useMountedOnlyState";

type CurrentFormId = string | undefined;
type CurrentForm = [CurrentFormId, React.Dispatch<React.SetStateAction<CurrentFormId>>];
type Form = { children: any, name: string, [otherPropNames: string]: any };

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

export const formWithVirtualNestability = (Form: React.ElementType) => ({ children, name, ...otherProps }: Form) => {
    const formInstanceRef = useRef(name);
    const currentFormContext = useContext(CurrentFormContext);
    const [localForm, setLocalForm] = useMountedOnlyState<CurrentFormId>(formInstanceRef.current);
    const [currentForm] = currentFormContext ?? [localForm, setLocalForm];
    const isInRenderedForm = currentForm === formInstanceRef.current;
    const isInOuterContext = Boolean(currentFormContext);

    const form = <FormIdContext.Provider value={formInstanceRef.current}>
        {isInRenderedForm
            ? <Form name={name} {...otherProps}>
                {children}
            </Form>
            : children}
    </FormIdContext.Provider>;

    return isInOuterContext
        ? <>{form}</>
        : <CurrentFormContext.Provider value={[localForm, setLocalForm]}>
            {form}
        </CurrentFormContext.Provider>;
};
