import { Errors } from "../domain";
import { useMountedOnlyState } from "./useMountedOnlyState";

type HookResult = {
    errorHandler: <T>(operation: Promise<T>) => Promise<T | undefined>,
    errors: Array<Error>,
    clearError: (error: Error) => void
};

export function useErrorHandler(): HookResult {
    const [errors, setErrors] = useMountedOnlyState<Errors>({});

    return {
        errorHandler: async <T>(operation: Promise<T>) => {
            try {
                return await operation;
            }
            catch (error) {
                setErrors(currentErrors => {
                    const message = error instanceof Error ? error?.message : error;
                    return {
                        ...currentErrors,
                        [message]: { message }
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