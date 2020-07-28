type ModelUpdate<T> = {
    target: string,
    update: any,
    model: T
};

type ValueTarget = {
    target: string,
    obj: any
}

type Diffs = Array<{
    location: string;
    updatedValue: any;
}>;

export type Errors = {
    [key: string]: Error;
};
const expand = ({ array, toMinLength }: { array: Array<any>, toMinLength: number }): Array<any> => {
    const theArray = array || [];
    return theArray.length >= toMinLength
        ? array
        : [...theArray, ...Array(toMinLength - theArray.length).fill(undefined)];
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
        ? expand({
            array: get<Array<any>>(parentLocation).from(model),
            toMinLength: currentArrayIndex + 1
        }).map((node, index) => index === currentArrayIndex ? update : node)
        : {
            ...get<any>(parentLocation).from(model),
            [currentLocation]: update
        };

    return lastDotIndex === -1
        ? updated
        : set(parentLocation).to(updated).in(model);
}

function getValueFrom<T>({ target, obj }: ValueTarget): T {
    const firstDotIndex = (target || "").indexOf(".");
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

export const distinctArrayFrom = (left: Array<any>, right: Array<any>) => {
    const composite = [...left, ...right];
    return composite.filter((value, index) => composite.indexOf(value) === index);
}

type IsObjectCheck = (original: any, updated: any) => boolean;

const origAndUpdatedAreObjects: IsObjectCheck = (original, updated) =>
    original instanceof Object && updated instanceof Object;

const updatedIsObject: IsObjectCheck = (original, updated) => updated instanceof Object;

const processDiffFor = (original: any, updated: any, isObject: IsObjectCheck): Diffs => {
    const prefixedLocation = (location: string) => (location || "").length > 0
        ? `.${location}`
        : location;

    return original === updated ? []
        : isObject(original, updated) ? distinctArrayFrom(
            Object.keys(original instanceof Object ? original : {}),
            Object.keys(updated))
            .flatMap(key => processDiffFor((original || {})[key], updated[key], isObject)
                .map(diff => ({ ...diff, location: key + prefixedLocation(diff.location) })))
            : [{ location: "", updatedValue: updated }];
};

const diffApiFrom = ({ recurseWhen }: { recurseWhen: IsObjectCheck }) => ({
    from: (original: any) => ({
        to: (updated: any) => processDiffFor(original, updated, recurseWhen)
    })
})

export const diff = diffApiFrom({ recurseWhen: origAndUpdatedAreObjects });

export const leafDiff = diffApiFrom({ recurseWhen: updatedIsObject });