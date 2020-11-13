import { useMountedOnlyState } from "./useMountedOnlyState";
import { ErrorHandler } from './useErrorHandler'

type Options = {
    minLoadingTime?: number
    errorHandler?: ErrorHandler
}

const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time));

export function useLoadingState(options?: Options): [boolean, <T>(theOperation: Promise<T>) => Promise<T>] {
    const [isLoading, setIsLoading] = useMountedOnlyState(false);
    async function start<T>(theOperation: Promise<T>): Promise<T> {
        setIsLoading(true);
        try {
            options?.minLoadingTime && await wait(options.minLoadingTime);
            const errorHandler = options?.errorHandler;

            await (errorHandler ? errorHandler(theOperation) : theOperation);

            return theOperation;
        }
        finally {
            setIsLoading(false);
        }
    }

    return [isLoading, start];
}