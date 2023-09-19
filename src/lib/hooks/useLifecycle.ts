import { useEffect, useRef } from "react"

type LifeCycle = {
    onMount?: () => any,
    onUnMount?: () => any
}

export const useLifeCycle = (lifeCycle: LifeCycle) => {
    const lifeCycleRef = useRef(lifeCycle);
    lifeCycleRef.current = lifeCycle;

    useEffect(() => {
        lifeCycleRef.current.onMount?.();
        return lifeCycleRef.current.onUnMount;
    }, []);
}