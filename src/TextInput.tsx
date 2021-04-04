import React, { useRef, useEffect, forwardRef } from 'react'

type TextInputProps = {
    autofocus?: boolean
    value: string,
    onChange: (updatedValue: string) => void,
    [otherProps: string]: any
};

function useCombinedRefs(...refs: any): React.MutableRefObject<any> {
    const targetRef = React.useRef()

    React.useEffect(() => {
        refs.forEach((ref: any) => {
            if (!ref) return

            if (typeof ref === 'function') {
                ref(targetRef.current)
            } else {
                ref.current = targetRef.current
            }
        })
    }, [refs])

    return targetRef
}

export const TextInput = forwardRef((props: TextInputProps, ref: any) => {
    const { autofocus, value, onChange, ...otherProps } = props;
    const onTextChange = (event: any) => onChange(event && event.target && event.target.value);
    const theInput = useRef<any>(ref);
    const combinedRef = useCombinedRefs(ref, theInput);

    useEffect(() => {
        if (autofocus) theInput?.current?.focus()
    }, [autofocus]);

    return <input
        className="form-control"
        {...otherProps}
        ref={combinedRef}
        type="text"
        value={value || ""}
        onChange={onTextChange} />
});