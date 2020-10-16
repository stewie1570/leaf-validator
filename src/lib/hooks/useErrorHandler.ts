import { useMountedOnlyState } from "./useMountedOnlyState";

interface ErrorMessage {
    message: string;
}

type Errors<TError> = {
    [key: string]: TError
}

type ErrorMappings<TError> = {
    mapMessage?: (currentMessage: string) => string,
    mapError?: (error: TError) => TError
}

type HookResult<TError> = {
    errorHandler: <T>(operation: Promise<T>, mappings?: ErrorMappings<TError>) => Promise<T | undefined>,
    errors: Array<TError>,
    clearError: (error: TError) => void
};

export function useErrorHandler<TError extends ErrorMessage>(hookMappings?: ErrorMappings<TError>): HookResult<TError> {
    const [errors, setErrors] = useMountedOnlyState<Errors<TError>>({});

    return {
        errorHandler: async (operation, handlerMappings) => {
            try {
                return await operation;
            }
            catch (error) {
                setErrors(updatedErrorsWith<TError>(mappedErrorFrom<TError>(error, {
                    ...hookMappings,
                    ...handlerMappings
                })));
            }
        },
        errors: Object.values(errors),
        clearError: error => setErrors(currentErrors => {
            const { [error.message]: removedError, ...otherErrors } = currentErrors;
            return otherErrors;
        })
    };
}

function mappedErrorFrom<TError extends ErrorMessage>(error: any, mappings: ErrorMappings<TError> | undefined) {
    const errorObject = error instanceof Object ? error : { message: error };
    const messageMappedError: TError = {
        ...errorObject,
        message: mappings?.mapMessage
            ? mappings.mapMessage(errorObject.message)
            : errorObject.message
    };
    const mappedError = mappings?.mapError
        ? mappings.mapError(messageMappedError)
        : messageMappedError;

    return mappedError;
}

function updatedErrorsWith<TError extends ErrorMessage>(error: TError) {
    return (currentErrors: Errors<TError>): Errors<TError> => ({
        ...currentErrors,
        [error.message]: error
    });
}
