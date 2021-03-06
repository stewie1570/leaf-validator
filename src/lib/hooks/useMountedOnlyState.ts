import { useState, Dispatch, SetStateAction, useRef, useEffect } from "react"

export const useMountedOnlyState = <T>(initialState: T): [T, Dispatch<SetStateAction<T>>] => {
    const [state, setState] = useState<T>(initialState);
    const instance = useRef({ isMounted: true });

    useEffect(() => () => { instance.current.isMounted = false; }, []);

    return [state, updatedState => instance.current.isMounted && setState(updatedState)];
}