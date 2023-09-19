import { useState, Dispatch, SetStateAction, useRef } from "react"
import { useLifeCycle } from "./useLifecycle";

export const useMountedOnlyState = <T>(initialState: T): [T, Dispatch<SetStateAction<T>>] => {
    const [state, setState] = useState<T>(initialState);
    const instance = useRef({ isMounted: true });

    useLifeCycle({
        onUnMount: () => { instance.current.isMounted = false; }
    });

    return [state, updatedState => instance.current.isMounted && setState(updatedState)];
}