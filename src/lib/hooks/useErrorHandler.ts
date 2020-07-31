import { useMountedOnlyState } from "./useMountedOnlyState";

type Errors<TError> = {
    [key: string]: TError
}

type HookResult<TError> = {
    errorHandler: <T>(operation: Promise<T>) => Promise<T | undefined>,
    errors: Array<TError>,
    clearError: (error: TError) => void
};

export function useErrorHandler<TError extends { message: string }>(): HookResult<TError> {
    const [errors, setErrors] = useMountedOnlyState<Errors<TError>>({});

    return {
        errorHandler: async <T>(operation: Promise<T>) => {
            try {
                return await operation;
            }
            catch (error) {
                setErrors(currentErrors => {
                    const message = error?.message || error;
                    return {
                        ...currentErrors,
                        [message]: error instanceof Object ? error : { message }
                    };
                });
            }
        },
        errors: Object.values(errors),
        clearError: error => setErrors(currentErrors => {
            const { [error.message]: removedError, ...otherErrors } = currentErrors;
            return otherErrors;
        })
    };
}