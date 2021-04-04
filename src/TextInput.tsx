import React, { useRef, useEffect, forwardRef } from 'react'

type TextInputProps = {
    autofocus?: boolean
    value: string,
    onChange: (updatedValue: string) => void,
    [otherProps: string]: any
};

const noOp = () => undefined;

export function TextInput(props: TextInputProps) {
    const { autofocus, value, onChange, ...otherProps } = props;
    const onTextChange = (event: any) => onChange(event && event.target && event.target.value);
    const theInput = useRef<any>({ focus: noOp });

    useEffect(() => {
        if (autofocus) theInput?.current?.focus()
    }, [autofocus]);

    return <input
        className="form-control"
        {...otherProps}
        ref={theInput}
        type="text"
        value={value || ""}
        onChange={onTextChange} />
}