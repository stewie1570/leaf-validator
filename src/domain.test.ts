import { get, set } from './domain'

describe("get target from object", () => {
    it("gets value from object location", () => {
        expect(get("level1.prop1").from({
            level1: {
                prop1: "expected value"
            }
        })).toBe("expected value");
    });

    it("get index from array", () => {
        expect(get("1").from([
            "not me",
            "you found me"
        ])).toBe("you found me");
    });

    it("get empty target string returns original", () => {
        expect(get("").from("expected")).toBe("expected");
    });

    it("returns undefined for non-existant target locations in object", () => {
        expect(get("somewhere.that.does.not.exist").from({})).toBe(undefined);
    })
});

describe("set value at target location of object to get next immutable progression", () => {
    it("sets the value at target location and keeps other refs", () => {
        const theObject = {
            prop1: {
                prop1: {
                    target: "original value"
                },
                prop2: {}
            },
            prop2: {}
        };

        const progession = set("prop1.prop1.target")
            .to("updated value")
            .in(theObject);

        expect(progession
            .prop1
            .prop1
            .target)
            .toBe("updated value");

        expect(progession.prop2).toBe(theObject.prop2);

        expect(progession.prop1.prop2).toBe(theObject.prop1.prop2);
    });

    it("can build an object by setting locations that dont exist", () => {
        expect(set("prop1.something.else").to("expected").in({})).toEqual({
            prop1: {
                something: {
                    else: "expected"
                }
            }
        });
    });

    it("can set a target value that navigates through an array", () => {
        expect(set("list.1.value").to("updated").in({
            list: [
                { value: "old" },
                { value: "old" },
                { value: "old" }
            ]
        })).toEqual({
            list: [
                { value: "old" },
                { value: "updated" },
                { value: "old" }
            ]
        });
    });
});
