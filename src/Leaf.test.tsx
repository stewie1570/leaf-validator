import React, { useState } from 'react'
import { render, fireEvent } from '@testing-library/react'
import { Leaf, useValidationFor } from './Leaf'
import { TextInput } from './TextInput'
import { get, set } from './domain'

describe("Component API", () => {
    it("can read & edit model nodes nested inside complex object models and arrays", () => {
        const Wrapper = () => {
            const [model, setModel] = useState({
                lists: {
                    emails: [
                        { email: "stewie1570@gmail.com" },
                        { email: "something_at_something.com" }
                    ]
                }
            });

            return <Leaf model={model} onChange={setModel} location="lists.emails">
                {(emailNodes: Array<any>, setEmailNodes) => emailNodes.map((emailNode, index) => <Leaf
                    key={index}
                    model={emailNode}
                    onChange={update => setEmailNodes(emailNodes.map((orig, i) => i === index ? update : orig))}
                    location={`email`}>
                    {(email: string, onChange) => <TextInput
                        data-testid={`email${index}`}
                        value={email}
                        onChange={onChange} />}
                </Leaf>)}
            </Leaf>
        }

        const { getByTestId } = render(<Wrapper />);

        expect((getByTestId("email0") as HTMLInputElement).value).toBe("stewie1570@gmail.com");
        expect((getByTestId("email1") as HTMLInputElement).value).toBe("something_at_something.com");

        fireEvent.change(getByTestId("email1"), { target: { value: "stewie1570@hotmail.com" } });

        expect((getByTestId("email0") as HTMLInputElement).value).toBe("stewie1570@gmail.com");
        expect((getByTestId("email1") as HTMLInputElement).value).toBe("stewie1570@hotmail.com");
    });
});

describe("Get/Set model API", () => {
    it("can read & edit model nodes inside complex object models and arrays", () => {
        const Wrapper = () => {
            const [model, setModel] = useState({
                lists: {
                    emails: [
                        { email: "stewie1570@gmail.com" },
                        { email: "something_at_something.com" }
                    ]
                }
            });
            return get<any>("lists.emails")
                .from(model)
                .map(({ email }: any, index: number) =>
                    <TextInput
                        key={index}
                        data-testid={`email${index}`}
                        value={email}
                        onChange={(emailAddress: string) => setModel(set(`lists.emails.${index}.email`).to(emailAddress).in(model))} />);
        }

        const { getByTestId } = render(<Wrapper />);

        expect((getByTestId("email0") as HTMLInputElement).value).toBe("stewie1570@gmail.com");
        expect((getByTestId("email1") as HTMLInputElement).value).toBe("something_at_something.com");

        fireEvent.change(getByTestId("email1"), { target: { value: "stewie1570@hotmail.com" } });

        expect((getByTestId("email0") as HTMLInputElement).value).toBe("stewie1570@gmail.com");
        expect((getByTestId("email1") as HTMLInputElement).value).toBe("stewie1570@hotmail.com");
    });

    it("validates model nodes inside complex object models and arrays", () => {
        const Wrapper = () => {
            const [model, setModel] = useState({
                lists: {
                    emails: [
                        { email: "stewie1570@gmail.com" },
                        { email: "something_at_something.com" }
                    ]
                }
            });
            const { validate, validationResultsFor } = useValidationFor(model);

            const isRequired = (value: any) => value || ["Value is required"];

            return get<any>("lists.emails")
                .from(model)
                .map(({ email }: any, index: number) =>
                    <div key={index}>
                        <TextInput
                            data-testid={`email${index}`}
                            value={email}
                            onBlur={() => validate(`lists.emails.${index}.email`).conformsTo(isRequired)}
                            onChange={(emailAddress: string) => setModel(set(`lists.emails.${index}.email`).to(emailAddress).in(model))} />
                        <ul>
                            {validationResultsFor(`lists.emails.${index}.email`)
                                .map((validationError: any, errorIndex: number) =>
                                    <li data-testid={`email${index}error`} key={errorIndex}>
                                        {validationError}
                                    </li>)}
                        </ul>
                    </div>)
        }

        const { queryAllByTestId, getAllByTestId, getByTestId } = render(<Wrapper />);

        expect(queryAllByTestId("email1error")).toEqual([]);

        fireEvent.change(getByTestId("email0"), { target: { value: "" } });
        fireEvent.blur(getByTestId("email0"));

        fireEvent.change(getByTestId("email1"), { target: { value: "" } });
        fireEvent.blur(getByTestId("email1"));

        expect(getAllByTestId("email0error").map(element => element.textContent)).toEqual(["Value is required"]);
        expect(getAllByTestId("email1error").map(element => element.textContent)).toEqual(["Value is required"]);
    });
})