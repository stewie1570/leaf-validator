import { get, set, diff } from './domain'

describe("diff", () => {
    it("should be empty for same value types", () => {
        expect(diff.from(1).to(1)).toEqual([]);
        expect(diff.from("hello").to("hello")).toEqual([]);
        expect(diff.from(true).to(true)).toEqual([]);
    });

    it("should return updated value types", () => {
        expect(diff.from(1).to(2)).toEqual([{ location: "", value: 2 }]);
        expect(diff.from(1).to({})).toEqual([{ location: "", value: {} }]);
        expect(diff.from("hello").to("hi")).toEqual([{ location: "", value: "hi" }]);
        expect(diff.from(true).to(false)).toEqual([{ location: "", value: false }]);
    });

    it("should map simple symmetrical objects to their diffs", () => {
        expect(diff.from({
            changed: "p1 value 1",
            original: "p2 value 1"
        }).to({
            changed: "p1 value 2",
            original: "p2 value 1"
        })).toEqual([{ location: "changed", value: "p1 value 2" }]);
    });

    it("should map simple non-symmetrical objects to their diffs", () => {
        const result = diff.from({
            changed: "p1 value 1",
            original: "p2 value 1"
        }).to({
            changed: "p1 value 2",
            new: "p2 value 1"
        });

        expect(result).toEqual([
            { location: "changed", value: "p1 value 2" },
            { location: "original", value: undefined },
            { location: "new", value: "p2 value 1" }
        ]);
    });

    it("should map complex non-symmetrical objects to their diffs", () => {
        const result = diff.from({
            outer: {
                changed: "p1 value 1",
                original: "p2 value 1"
            }
        }).to({
            outer: {
                changed: "p1 value 2",
                new: "p2 value 1"
            }
        });

        expect(result).toEqual([
            { location: "outer.changed", value: "p1 value 2" },
            { location: "outer.original", value: undefined },
            { location: "outer.new", value: "p2 value 1" }
        ]);
    });

    it("should map complex non-symmetrical objects inside arrays inside an object to their diffs", () => {
        const result = diff.from({
            outer: [
                {
                    wrapper: {
                        changed: "p1 value 1",
                        original: "p2 value 1"
                    }
                }
            ]
        }).to({
            outer: [
                {
                    wrapper: {
                        changed: "p1 value 2",
                        new: "p2 value 1"
                    }
                }
            ]
        });

        expect(result).toEqual([
            { location: "outer.0.wrapper.changed", value: "p1 value 2" },
            { location: "outer.0.wrapper.original", value: undefined },
            { location: "outer.0.wrapper.new", value: "p2 value 1" }
        ]);
    });
});

describe("diff and set working together", () => {
    it("should show that applying the diffs (created from original to updated) to the original constructs an updated equivalent", () => {
        const original = {
            outer: [
                {
                    wrapper: {
                        changed: "p1 value 1",
                        original: "p2 value 1"
                    }
                }
            ]
        };
        const updated = {
            outer: [
                {
                    wrapper: {
                        changed: "p1 value 2",
                        new: "p2 value 1"
                    }
                }
            ]
        };
        const diffs = diff.from(original).to(updated);
        let constructed = original;
        diffs.forEach(diff => {
            constructed = set(diff.location).to(diff.value).in(constructed);
        });

        expect(constructed).toEqual(updated);
    })
});

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
