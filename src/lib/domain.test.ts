import { get, set, diff, leafDiff } from './domain'

describe("diff", () => {
    it("should be empty for same value types", () => {
        [diff, leafDiff].forEach(sut => {
            expect(sut.from(1).to(1)).toEqual([]);
            expect(sut.from("hello").to("hello")).toEqual([]);
            expect(sut.from(true).to(true)).toEqual([]);
        });
    });

    it("should return updated value types", () => {
        [diff, leafDiff].forEach(sut => {
            expect(sut.from(1).to(2)).toEqual([{ location: "", updatedValue: 2 }]);
            expect(sut.from("hello").to("hi")).toEqual([{ location: "", updatedValue: "hi" }]);
            expect(sut.from(true).to(false)).toEqual([{ location: "", updatedValue: false }]);
        });

        expect(diff.from(1).to({})).toEqual([{ location: "", updatedValue: {} }]);
        expect(leafDiff.from(1).to({})).toEqual([]);
    });

    it("should map simple symmetrical objects to their diffs", () => {
        [diff, leafDiff].forEach(sut => {
            expect(sut.from({
                changed: "p1 value 1",
                original: "p2 value 1"
            }).to({
                changed: "p1 value 2",
                original: "p2 value 1"
            })).toEqual([{ location: "changed", updatedValue: "p1 value 2" }]);
        });
    });

    it("should show an entire sub-object has been removed from the original", () => {
        [diff, leafDiff].forEach(sut => {
            expect(sut.from({
                left: {
                    with: {
                        some: ["values"]
                    }
                },
                right: {
                    has: {
                        some: ["other values"]
                    }
                }
            }).to({
                right: {
                    has: {
                        some: ["other values"]
                    }
                }
            })).toEqual([{ location: "left", updatedValue: undefined }]);

            expect(sut.from({
                left: {
                    with: {
                        some: ["values"]
                    }
                },
                right: {
                    has: {
                        some: ["other values"]
                    }
                }
            }).to({
                left: {
                    with: {
                        some: ["values"]
                    }
                },
                right: {}
            })).toEqual([{ location: "right.has", updatedValue: undefined }]);
        });
    });

    it("should support leaf creation and object creation", () => {
        const updatedObject = {
            some: {
                complex: {
                    object: {
                        with: ["values"],
                        and: ["other", "values"]
                    }
                }
            }
        };
        expect(diff.from(null).to(updatedObject)).toEqual([
            {
                location: "",
                updatedValue: updatedObject
            }
        ]);

        expect(leafDiff.from(null).to(updatedObject)).toEqual([
            { location: "some.complex.object.with.0", updatedValue: "values" },
            { location: "some.complex.object.and.0", updatedValue: "other" },
            { location: "some.complex.object.and.1", updatedValue: "values" }
        ]);
    })

    it("should map simple non-symmetrical objects to their diffs", () => {
        [diff, leafDiff].forEach(sut => {
            const result = sut.from({
                changed: "p1 value 1",
                original: "p2 value 1"
            }).to({
                changed: "p1 value 2",
                new: "p2 value 1"
            });

            expect(result).toEqual([
                { location: "changed", updatedValue: "p1 value 2" },
                { location: "original", updatedValue: undefined },
                { location: "new", updatedValue: "p2 value 1" }
            ]);
        });
    });

    it("should map complex non-symmetrical objects to their diffs", () => {
        [diff, leafDiff].forEach(sut => {
            const result = sut.from({
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
                { location: "outer.changed", updatedValue: "p1 value 2" },
                { location: "outer.original", updatedValue: undefined },
                { location: "outer.new", updatedValue: "p2 value 1" }
            ]);
        });
    });

    it("should map complex non-symmetrical objects inside arrays inside an object to their diffs", () => {
        [diff, leafDiff].forEach(sut => {
            const result = sut.from({
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
                { location: "outer.0.wrapper.changed", updatedValue: "p1 value 2" },
                { location: "outer.0.wrapper.original", updatedValue: undefined },
                { location: "outer.0.wrapper.new", updatedValue: "p2 value 1" }
            ]);
        });
    });
});

describe("diff and set working together", () => {
    it("should show that applying the diffs (created from original to updated) to the original constructs an updated equivalent", () => {
        [diff, leafDiff].forEach(sut => {
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
                        },
                        other: {
                            created: "stuff",
                            and: ["other", "stuff"]
                        }
                    }
                ]
            };
            const diffs = sut.from(original).to(updated);
            let constructed = original;
            diffs.forEach(diff => {
                constructed = set(diff.location).to(diff.updatedValue).in(constructed);
            });

            expect(constructed).toEqual(updated);
        });
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
    it("can build complex objects with multiple nested arrays in the middle", () => {
        expect(set("outer.1.inner.0.prop").to("value").in({})).toEqual({
            outer: [
                undefined,
                {
                    inner: [
                        { prop: "value" }
                    ]
                }
            ]
        });
    });

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
