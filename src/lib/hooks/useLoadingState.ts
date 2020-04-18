import { useState } from "react";

export function useLoadingState(): [boolean, <T>(theOperation: Promise<T>) => Promise<T>] {
    const [isLoading, setIsLoading] = useState(false);
    async function start<T>(theOperation: Promise<T>): Promise<T> {
        setIsLoading(true);
        try {
            return await theOperation;
        }
        finally {
            setIsLoading(false);
        }
    }

    return [isLoading, start];
}