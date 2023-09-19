import { useRef, useEffect } from "react";

export function useDeferredEffect(
    action: () => void,
    deferredTimeout: number,
    deps: Array<any>) {
    const instance = useRef<any>({ timer: undefined, action });
    instance.current = { ...instance.current, action };

    useEffect(() => {
        instance.current.timer && clearTimeout(instance.current.timer);
        instance.current.timer = setTimeout(instance.current.action, deferredTimeout);

        return () => {
            instance.current.timer && clearTimeout(instance.current.timer);
        }
    },
        // eslint-disable-next-line
        [deferredTimeout, ...deps]);
}