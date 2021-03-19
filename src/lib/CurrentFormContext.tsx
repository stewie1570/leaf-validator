import React, { useRef } from "react";
import { createContext, useContext } from "react";
import { useMountedOnlyState } from "./hooks/useMountedOnlyState";

type CurrentFormId = object | undefined;
type CurrentForm = [CurrentFormId, React.Dispatch<React.SetStateAction<CurrentFormId>>];

const CurrentFormContext = createContext<CurrentForm>([undefined, () => undefined]);
const FormIdContext = createContext<any>(undefined);

export const withVirtualNestability = (Form: React.ElementType) => ({ children, ...otherProps }: any) => {
    const currentForm = useContext(CurrentFormContext);
    const formInstanceRef = useRef({});
    const form = <FormIdContext.Provider value={formInstanceRef.current}>
        {currentForm && currentForm[0] === formInstanceRef.current
            ? <Form {...otherProps}>
                {children}
            </Form>
            : children}
    </FormIdContext.Provider>;

    return currentForm
        ? form
        : <OuterForm>
            {form}
        </OuterForm>;
};

export const withFormSelectionOnFocus = (Input: React.ElementType) => (props: any) => {
    const { onFocus, ...otherProps } = props;
    const formId = useContext(FormIdContext);
    const [currentFormId, setCurrentFormId] = useContext(CurrentFormContext);

    const handleFocus = (...args: any) => {
        setCurrentFormId(formId);
        onFocus?.(...args);
    }

    return <Input {...otherProps} onFocus={handleFocus} />;
}

function OuterForm({ children }: any) {
    const [currentForm, setCurrentForm] = useMountedOnlyState<CurrentFormId>(undefined);

    return <CurrentFormContext.Provider value={[currentForm, setCurrentForm]}>
        {children}
    </CurrentFormContext.Provider>;
}
