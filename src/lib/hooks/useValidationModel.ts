import { ValidationModel } from "../models";
import { useMountedOnlyState as useState } from "./useMountedOnlyState";
import { distinctArrayFrom } from '../domain'
import { useMemo } from "react";

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
    const [validationModel, setValidationModel] = useState<any>({});
    const [currentlyValidatingNamespaces, setNamespacesCurrentlyValidating] = useState<Array<string>>([]);

    return useMemo(() => ({
        set: setValidationModel,
        validationModel,
        currentlyValidatingNamespaces,
        setNamespacesCurrentlyValidating
    }), [validationModel, currentlyValidatingNamespaces]);
}

export const getErrorsForLocation = (location: string) => ({
    from: ({ validationModel }: any) => {
        const validationModelsFromAllNamespaces = Object.values(validationModel);
        return validationModelsFromAllNamespaces
            .map((validationModel: any) => validationModel[location] || [])
            .flat();
    }
});

export const getAllErrorsForLocation = (location?: string) => ({
    from: ({ validationModel }: any) => {
        const validationModelsFromAllNamespaces = Object.values(validationModel);
        const unGroupedResults = validationModelsFromAllNamespaces
            .map((validationModel: any) => filteredObjectToArray(validationModel,
                {
                    keyFilter: key => key.startsWith(location || ""),
                    mapper: (key, value) => ({ location: key, messages: value })
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
    }
});

export const isValidationInProgress = ({
    in: ({ currentlyValidatingNamespaces }: any) => currentlyValidatingNamespaces.length > 0
});