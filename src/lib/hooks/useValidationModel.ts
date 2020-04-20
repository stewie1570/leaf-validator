import { ValidationModel } from "../models";
import { useMountedOnlyState } from "./useMountedOnlyState";

type FilteredObjectOptions<T> = {
    keyFilter: (key: string) => boolean,
    mapper: (key: string, value: any) => T
}

function filteredObjectToArray<T>(obj: any, options: FilteredObjectOptions<T>): Array<T> {
    return Object
        .keys(obj)
        .filter(options.keyFilter)
        .map(key => options.mapper(key, obj[key]));
}

export function useValidationModel(): ValidationModel {
    const [validationModel, setValidationModel] = useMountedOnlyState<any>({});

    return {
        set: setValidationModel,
        get: (location: string) => validationModel[location] || [],
        getAllErrorsForLocation: location => filteredObjectToArray(validationModel,
            {
                keyFilter: key => key.startsWith(location),
                mapper: (key, value) => ({ location: key, messages: value })
            })
            .filter(error => error?.messages?.length)
    }
}