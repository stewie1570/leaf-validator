import { useState } from "react";

export function useLoadingState(): [boolean, <T>(theOperation: Promise<T>) => Promise<T>] {
    const [isLoading, setIsLoading] = useState(false);
    async function start<T>(theOperation: Promise<T>): Promise<T> {
        setIsLoading(true);
        try {
            const result = await theOperation;
            return result;
        }
        finally {
            setIsLoading(false);
        }
    }

    return [isLoading, start];
}