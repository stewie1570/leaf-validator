import { useRef, useEffect } from "react";

export function useDeferredEffect(
    action: () => void,
    deferredTimeout: number,
    deps: Array<any>) {
    const instance = useRef<any>({ timer: undefined });

    useEffect(() => {
        instance.current.timer && clearTimeout(instance.current.timer);
        instance.current.timer = setTimeout(action, deferredTimeout);

        return () => {
            // eslint-disable-next-line
            instance.current.timer && clearTimeout(instance.current.timer);
        }
    },
        // eslint-disable-next-line
        [deferredTimeout, ...deps]);
}