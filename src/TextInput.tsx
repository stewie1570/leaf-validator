import React, { useRef, useEffect } from 'react'

type TextInputProps = {
    autofocus?: boolean
    value: string,
    onChange: (updatedValue: string) => void,
    [otherProps: string]: any
};

export function TextInput(props: TextInputProps) {
    const { autofocus, value, onChange, ...otherProps } = props;
    const onTextChange = (event: any) => onChange(event && event.target && event.target.value);
    const theInput = useRef<any>();

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