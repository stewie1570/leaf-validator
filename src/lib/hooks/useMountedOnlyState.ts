import { useState, Dispatch, SetStateAction, useRef, useEffect } from "react"

export const useMountedOnlyState = <T>(initialState: T): [T, Dispatch<SetStateAction<T>>] => {
    const [state, setState] = useState<T>(initialState);
    const instance = useRef({ isMounted: true });
    instance.current.isMounted = true;

    useEffect(() => {
        instance.current.isMounted = true;

        return () => {
            instance.current.isMounted = false;
        };
    }, []);

    return [state, updatedState => {
        if (updatedState === 1) console.log({ mounted: instance.current.isMounted, state, updatedState });
        instance.current.isMounted && setState(updatedState);
    }];
}