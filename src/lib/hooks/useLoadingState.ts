import { useMountedOnlyState as useState } from "./useMountedOnlyState";
import { ErrorHandler } from './useErrorHandler'
import { useCallback, useRef } from "react";

type Options = {
    minLoadingTime?: number
    errorHandler?: ErrorHandler
}

const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time));

export function useLoadingState(options?: Options): [boolean, <T>(theOperation: Promise<T>) => Promise<T | undefined>] {
    const [isLoading, setIsLoading] = useState(false);
    const optionsRef = useRef(options);
    const start = useCallback(async <T>(theOperation: Promise<T>): Promise<T | undefined> => {
        setIsLoading(true);
        try {
            optionsRef.current?.minLoadingTime && await wait(optionsRef.current.minLoadingTime);
            const response = optionsRef.current?.errorHandler
                ? optionsRef.current.errorHandler(theOperation)
                : theOperation;
                
            return await response;
        }
        finally {
            setIsLoading(false);
        }
    }, []);

    return [isLoading, start];
}