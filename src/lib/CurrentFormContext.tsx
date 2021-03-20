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
    const [currentForm, setCurrentForm] = useContext(CurrentFormContext) ?? [undefined, () => undefined];
    const formInstanceRef = useRef({ name });
    const isInRenderedForm = currentForm === formInstanceRef.current;
    console.log(`selected form: ${JSON.stringify(currentForm)} === me: ${JSON.stringify(formInstanceRef.current)} > ${isInRenderedForm}`);
    const form = <FormIdContext.Provider value={formInstanceRef.current}>
        {isInRenderedForm
            ? <Form name={name} {...otherProps}>
                {children}
            </Form>
            : children}
    </FormIdContext.Provider>;

    const isInOuterContext = Boolean(currentForm);

    return isInOuterContext
        ? <>{form}</>
        : <OuterForm>{form}</OuterForm>;
};

function OuterForm({ children }: any) {
    const [currentForm, setCurrentForm] = useMountedOnlyState<CurrentFormId>({});

    return <CurrentFormContext.Provider value={[currentForm, setCurrentForm]}>
        {children}
    </CurrentFormContext.Provider>;
}
