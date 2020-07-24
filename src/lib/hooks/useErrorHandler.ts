import { useState } from "react";

export function useErrorHandler() {
    const [error, setError] = useState<Error>();
    if (error) {
        setError(undefined);
        throw error;
    }
    return async function <T>(operation: Promise<T>) {
        try {
            return await operation;
        }
        catch (error) {
            setError(error);
        }
    };
}