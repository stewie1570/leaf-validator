import { ValidationModel } from "../models";
import { useMountedOnlyState } from "./useMountedOnlyState";
import { distinctArrayFrom, isValidating } from '../domain'

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

// Example validation model
// {
//     "deferred": {
//         "some.location": [
//             "some error"
//         ]
//     },
//     "non-deferred": {
//         "some.other.location": [
//             "some other error"
//         ]
//     }
// }

export function useValidationModel(): ValidationModel {
    const [validationModel, setValidationModel] = useMountedOnlyState<any>({});

    return {
        set: setValidationModel,
        get: (location: string) => {
            const validationModelsFromAllNamespaces = Object.values(validationModel);
            return validationModelsFromAllNamespaces
                .map((validationModel: any) => validationModel[location] || [])
                .flat()
                .filter(value => value !== isValidating)
        },
        getAllErrorsForLocation: (location, options) => {
            const removeIsValidatingResults = !(options?.includeIsValidating === true);
            const validationModelsFromAllNamespaces = Object.values(validationModel);
            const unGroupedResults = validationModelsFromAllNamespaces
                .map((validationModel: any) => filteredObjectToArray(validationModel,
                    {
                        keyFilter: key => key.startsWith(location || ""),
                        mapper: (key, messages) => ({
                            location: key,
                            messages: removeIsValidatingResults
                                ? messages.filter((message: string) => message !== isValidating)
                                : messages
                        })
                    })
                    .filter(error => error?.messages?.length))
                .flat();
            const locations = distinctArrayFrom(unGroupedResults.map(result => result.location), []);
            return locations.map(location => ({
                location,
                messages: unGroupedResults
                    .filter(result => result.location === location)
                    .map(result => result.messages)
                    .flat()
            }));
        },
        isValidating: () => Object
            .values<object>(validationModel)
            .map(Object.values)
            .flat(2)
            .some(value => value === isValidating)
    }
}
