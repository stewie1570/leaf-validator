import type { Dispatch, SetStateAction } from "react";

export type Error = {
    location: string;
    messages: Array<string>;
};

export type ValidationModel = {
    set: Dispatch<any>,
    get: (location: string) => Array<string>,
    getAllErrorsForLocation: (location?: string) => Array<Error>,
    isValidationInProgress: () => boolean,
    setNamespacesCurrentlyValidating: Dispatch<SetStateAction<Array<string>>>
};