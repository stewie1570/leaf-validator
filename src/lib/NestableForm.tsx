import React, { useRef } from "react";
import { createContext, useContext } from "react";
import { useMountedOnlyState } from "./hooks/useMountedOnlyState";

type CurrentFormId = object | undefined;
type CurrentForm = [CurrentFormId, React.Dispatch<React.SetStateAction<CurrentFormId>>];

const CurrentFormContext = createContext<CurrentForm | undefined>(undefined);
const FormIdContext = createContext<any>(undefined);

export const inputWithFormSelectionOnFocus = (Input: React.ElementType) => (props: any) => {
    const { onFocus, ...otherProps } = props;
    const formId = useContext(FormIdContext);
    const [currentFormId, setCurrentFormId] = useContext(CurrentFormContext) ?? [undefined, () => undefined];

    const handleFocus = (...args: any) => {
        setCurrentFormId(formId);
        onFocus?.(...args);
    }

    return <Input {...otherProps} onFocus={handleFocus} />;
}

export const formWithVirtualNestability = (Form: React.ElementType) => ({ children, name, ...otherProps }: any) => {
    const formInstanceRef = useRef(name);
    const [localForm, setLocalForm] = useMountedOnlyState<CurrentFormId>(formInstanceRef.current);
    const currentFormContext = useContext(CurrentFormContext);
    const [currentForm] = currentFormContext ?? [localForm, setLocalForm];
    const isInRenderedForm = currentForm === formInstanceRef.current;
    const form = <FormIdContext.Provider value={formInstanceRef.current}>
        {isInRenderedForm
            ? <Form name={name} {...otherProps}>
                {children}
            </Form>
            : children}
    </FormIdContext.Provider>;

    const isInOuterContext = Boolean(currentFormContext);

    return isInOuterContext
        ? <>{form}</>
        : <CurrentFormContext.Provider value={[localForm, setLocalForm]}>
            <div data-something="CONTEXT">
                {form}
            </div>
        </CurrentFormContext.Provider>;
};
