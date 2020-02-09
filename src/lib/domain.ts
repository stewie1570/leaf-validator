export const get = <T>(target: string) => ({
    from: (obj: any): T => {
        const firstDotIndex = target.indexOf(".");
        const childLocation = firstDotIndex === -1
            ? target
            : target.substring(0, firstDotIndex);

        return target === "" || obj === undefined ? obj
            : firstDotIndex === -1
                ? obj[target]
                : get(target.substring(firstDotIndex + 1)).from(obj[childLocation]);
    }
});

export const set = (target: string) => ({
    to: (update: any) => ({
        in: <T>(obj: T): T => {
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
                    .from(obj)
                    .map((node, index) => index === currentArrayIndex ? update : node)
                : {
                    ...get<any>(parentLocation).from(obj),
                    [currentLocation]: update
                };

            return lastDotIndex === -1
                ? updated
                : set(parentLocation).to(updated).in(obj);
        }
    })
});