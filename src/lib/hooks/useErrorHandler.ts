import { useState, useRef } from "react";

export function useErrorHandler() {
    const [error, setError] = useState<Error>();
    const lastThrownError = useRef<Error>();
    if (error) {
        const shouldThrow = lastThrownError.current !== error;
        lastThrownError.current = error;
        if (shouldThrow) {
            throw error;
        }
    }
    return async function <T>(operation: () => Promise<T>) {
        try {
            return await operation();
        }
        catch (error) {
            setError(error);
        }
    };
}