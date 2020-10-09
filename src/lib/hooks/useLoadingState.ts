import { useMountedOnlyState } from "./useMountedOnlyState";
import { whenAny } from '../domain';

type Options = {
    defer?: number,
    minLoadingTime?: number
}

const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time));

function when(promise: Promise<any>) {
    return {
        rejectsOrResolves: async (resolve: () => void): Promise<any> => {
            try {
                return await promise;
            }
            catch (error) {
            }
            resolve();
        }
    };
}

export function useLoadingState(options?: Options): [boolean, <T>(theOperation: Promise<T>) => Promise<T>] {
    const [isLoading, setIsLoading] = useMountedOnlyState(false);
    const [hasTaskFinished, setHasTaskFinished] = useMountedOnlyState(false);

    async function doLoadingStateFlowFor<T>(theOperation: Promise<T>): Promise<T> {
        setIsLoading(true);
        try {
            options?.minLoadingTime && await wait(options.minLoadingTime);

            return await theOperation;
        }
        finally {
            setIsLoading(false);
        }
    }

    async function start<T>(theOperation: Promise<T>): Promise<T> {
        options?.defer && await whenAny([
            wait(options.defer),
            when(theOperation).rejectsOrResolves(() => setHasTaskFinished(true))
        ]);

        return hasTaskFinished ? theOperation : await doLoadingStateFlowFor(theOperation);
    }

    return [isLoading, start];
}