import React, { useRef } from 'react'
import { useLifeCycle } from './lib/hooks/useLifecycle';

type TextInputProps = {
    autofocus?: boolean
    value: string,
    onChange: (updatedValue: string) => void,
    [otherProps: string]: any
};

export function TextInput(props: TextInputProps) {
    const { autofocus, value, onChange, ...otherProps } = props;
    const propsRef = useRef(props);
    propsRef.current = props;
    const onTextChange = (event: any) => onChange(event && event.target && event.target.value);
    const theInput = useRef<any>();

    useLifeCycle({
        onMount: () => propsRef.current.autofocus && theInput?.current?.focus()
    });

    return <input
        className="form-control"
        {...otherProps}
        ref={theInput}
        type="text"
        value={value || ""}
        onChange={onTextChange} />
}