import { useMountedOnlyState } from "./useMountedOnlyState";
import { useRef } from "react";

type Options = {
    defer?: number,
    minLoadingTime?: number
}

const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time));

export function useLoadingState(options?: Options): [boolean, <T>(theOperation: Promise<T>) => Promise<T>] {
    const [isLoading, setIsLoading] = useMountedOnlyState(false);
    const timer = useRef<NodeJS.Timeout>();
    async function start<T>(theOperation: Promise<T>): Promise<T> {
        if (options?.defer) {
            timer.current = setTimeout(() => setIsLoading(true), options.defer)
        }
        else {
            setIsLoading(true);
        }

        try {
            if (options?.minLoadingTime) {
                await wait(options.minLoadingTime);
            }
            return await theOperation;
        }
        finally {
            timer?.current && clearTimeout(timer.current);
            setIsLoading(false);
        }
    }

    return [isLoading, start];
}