export type Error = {
    location: string;
    messages: Array<string>;
};

export type ValidationModel = {
    set: React.Dispatch<any>,
    setNamespacesCurrentlyValidating: React.Dispatch<React.SetStateAction<Array<string>>>
};