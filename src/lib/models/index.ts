export type Error = {
    location: string;
    messages: Array<string>;
};

export type ValidationModel = {
    set: React.Dispatch<any>,
    get: (location: string) => Array<string>,
    getAllErrorsForLocation: (location?: string) => Array<Error>,
    isValidationInProgress: () => boolean,
    setNamespacesCurrentlyValidating: React.Dispatch<React.SetStateAction<Array<string>>>
};