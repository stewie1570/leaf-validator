import { useMountedOnlyState } from "./useMountedOnlyState";

type Options = {
    minLoadingTime?: number
}

const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time));

export function useLoadingState(options?: Options): [boolean, <T>(theOperation: Promise<T>) => Promise<T>] {
    const [isLoading, setIsLoading] = useMountedOnlyState(false);
    async function start<T>(theOperation: Promise<T>): Promise<T> {
        setIsLoading(true);
        try {
            options?.minLoadingTime && await wait(options.minLoadingTime);

            return await theOperation;
        }
        finally {
            setIsLoading(false);
        }
    }

    return [isLoading, start];
}