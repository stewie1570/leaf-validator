export const get = (target: string) => ({
    from: (obj: any): any => {
        const dotIndex = target.indexOf(".");
        const next = dotIndex === -1
            ? target
            : target.substring(0, dotIndex);

        return target === "" || obj === undefined ? obj
            : dotIndex === -1
                ? obj[target]
                : get(target.substring(dotIndex + 1)).from(obj[next]);
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

            const updated = {
                ...get(parentLocation).from(obj),
                [currentLocation]: update
            };

            return lastDotIndex === -1
                ? updated
                : set(parentLocation).to(updated).in(obj);
        }
    })
});