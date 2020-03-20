type ModelUpdate<T> = {
    target: string,
    update: any,
    model: T
};

type ValueTarget = {
    target: string,
    obj: any
}

function getModelProgressionFrom<T>({ target, update, model }: ModelUpdate<T>): T {
    const lastDotIndex = target.lastIndexOf(".");
    const parentLocation = lastDotIndex === -1
        ? ""
        : target.substring(0, lastDotIndex);
    const currentLocation = lastDotIndex === -1
        ? target
        : target.substring(lastDotIndex + 1);
    const currentArrayIndex = parseInt(currentLocation);
    const currentlyInArray = !isNaN(currentArrayIndex);

    const updated = currentlyInArray
        ? get<Array<any>>(parentLocation)
            .from(model)
            .map((node, index) => index === currentArrayIndex ? update : node)
        : {
            ...get<any>(parentLocation).from(model),
            [currentLocation]: update
        };

    return lastDotIndex === -1
        ? updated
        : set(parentLocation).to(updated).in(model);
}

function getValueFrom<T>({ target, obj }: ValueTarget): T {
    const firstDotIndex = target.indexOf(".");
    const childLocation = firstDotIndex === -1
        ? target
        : target.substring(0, firstDotIndex);

    return target === "" || obj === undefined ? obj
        : firstDotIndex === -1
            ? obj[target]
            : get(target.substring(firstDotIndex + 1)).from(obj[childLocation]);
}

export const get = <T>(target: string) => ({
    from: (obj: any): T => getValueFrom<T>({ target, obj })
});

export const set = (target: string) => ({
    to: (update: any) => ({
        in: <T>(obj: T): T => getModelProgressionFrom({ target, update, model: obj })
    })
});

const noDiff = {};

const distinctArrayFrom = (left: Array<any>, right: Array<any>) => {
    const composite = [...left, ...right];
    return composite.filter((value, index) => composite.indexOf(value) === index);
}

export const diff = {
    from: (original: any) => ({
        to: (updated: any): Array<{ location: string, value: any }> => {
            const isObject = original instanceof Object && updated instanceof Object;
            const prefixedLocation = (location: string) => (location || "").length > 0
                ? `.${location}`
                : location;

            return isObject
                ? distinctArrayFrom(Object.keys(original), Object.keys(updated))
                    .flatMap(key => diff
                        .from(original[key])
                        .to(updated[key])
                        .map(diff => ({ ...diff, location: key + prefixedLocation(diff.location) })))
                : [original === updated ? noDiff : updated]
                    .filter(diff => diff !== noDiff)
                    .map(updatedValue => ({ location: "", value: updatedValue }));
        }
    })
};