import React, { useState } from 'react'
import { render, fireEvent, waitForDomChange } from '@testing-library/react'
import { Leaf, useValidationModelFor } from './Leaf'
import { TextInput } from '../TextInput'

test("can read & edit model nodes nested inside complex object models and arrays", () => {
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

test("validate model node and show errors on blur", async () => {
    const Wrapper = () => {
        const [model, setModel] = useState({ contact: { email: "stewie1570@gmail.com" } });
        const validationModel = useValidationModelFor(model);

        const isRequired = (value: string) => (!value || value.trim() === "") && ["Value is required"];

        return <Leaf
            model={model}
            onChange={setModel}
            location="contact.email"
            validationModel={validationModel}
            validators={[isRequired]}>
            {(email: string, onChange, onBlur, errors) => <>
                <TextInput value={email} onChange={onChange} onBlur={onBlur} data-testid="email" />
                {errors.length > 0 && <ul>
                    {errors.map((error, index) => <li data-testid="error" key={index}>{error}</li>)}
                </ul>}
            </>}
        </Leaf>
    }

    const { getByTestId, queryAllByTestId, getAllByTestId } = render(<Wrapper />);

    expect(queryAllByTestId("error").map(node => node.textContent)).toEqual([]);
    fireEvent.change(getByTestId("email"), { target: { value: "" } });
    expect(queryAllByTestId("error").map(node => node.textContent)).toEqual([]);
    fireEvent.blur(getByTestId("email"));
    await waitForDomChange();
    expect(getAllByTestId("error").map(node => node.textContent)).toEqual(["Value is required"]);
});

test("validate model asynchronously and show errors on blur", async () => {
    let resolver = () => { };

    const Wrapper = () => {
        const [model, setModel] = useState({ contact: { email: "stewie1570@gmail.com" } });
        const validationModel = useValidationModelFor(model);

        const isValid = async (value: string) => {
            if (value === "second")
                return Promise.resolve(`"${value}" is invalid.`);

            if (value === "first")
                return new Promise(resolve => { resolver = () => resolve(value) });
        };


        return <Leaf
            model={model}
            onChange={setModel}
            location="contact.email"
            validationModel={validationModel}
            validators={[isValid]}>
            {(email: string, onChange, onBlur, errors) => <>
                <TextInput value={email} onChange={onChange} onBlur={onBlur} data-testid="email" />
                {errors.length > 0 && <ul>
                    {errors.map((error, index) => <li data-testid="error" key={index}>{error}</li>)}
                </ul>}
            </>}
        </Leaf>
    }

    const { getByTestId, getAllByTestId } = render(<Wrapper />);

    fireEvent.change(getByTestId("email"), { target: { value: "first" } });
    fireEvent.blur(getByTestId("email"));
    fireEvent.change(getByTestId("email"), { target: { value: "second" } });
    fireEvent.blur(getByTestId("email"));
    await waitForDomChange();
    resolver();
    expect(getAllByTestId("error").map(node => node.textContent)).toEqual(['"second" is invalid.']);
});

test("validate model immediately show errors", async () => {
    const Wrapper = () => {
        const [model, setModel] = useState({ contact: { email: "" } });
        const validationModel = useValidationModelFor(model);

        const isRequired = (value: string) => (!value || value.trim() === "") && ["Value is required"];

        return <Leaf
            showErrors
            model={model}
            onChange={setModel}
            location="contact.email"
            validationModel={validationModel}
            validators={[isRequired]}>
            {(email: string, onChange, onBlur, errors) => <>
                <TextInput value={email} onChange={onChange} onBlur={onBlur} />
                {errors.length > 0 && <ul>
                    {errors.map((error, index) => <li data-testid="error" key={index}>{error}</li>)}
                </ul>}
            </>}
        </Leaf>
    }

    const { getAllByTestId } = render(<Wrapper />);

    await waitForDomChange();

    expect(getAllByTestId("error").map(node => node.textContent)).toEqual(["Value is required"]);
});

test("validate multiple model nodes", async () => {
    const Wrapper = () => {
        const [model, setModel] = useState({ contact: { firstName: "", lastName: "" } });
        const validationModel = useValidationModelFor(model);

        const isRequired = (value: string) => (!value || value.trim() === "") && ["Value is required"];

        return <>
            <Leaf
                showErrors
                model={model}
                onChange={setModel}
                location="contact.firstName"
                validationModel={validationModel}
                validators={[isRequired]}>
                {(email: string, onChange, onBlur, errors) => <>
                    <TextInput value={email} onChange={onChange} onBlur={onBlur} data-testid="firstName" />
                    {errors.length > 0 && <ul>
                        {errors.map((error, index) => <li data-testid="error" key={index}>{error}</li>)}
                    </ul>}
                </>}
            </Leaf>
            <Leaf
                showErrors
                model={model}
                onChange={setModel}
                location="contact.lastName"
                validationModel={validationModel}
                validators={[isRequired]}>
                {(email: string, onChange, onBlur, errors) => <>
                    <TextInput value={email} onChange={onChange} onBlur={onBlur} data-testid="lastName" />
                    {errors.length > 0 && <ul>
                        {errors.map((error, index) => <li data-testid="error" key={index}>{error}</li>)}
                    </ul>}
                </>}
            </Leaf>
            <ul>
                {validationModel.getAllErrorsForLocation("").map((error, index) => <li key={index} data-testid="top-level-error">
                    {error.location} - {error.messages}
                </li>)}
            </ul>
        </>
    }

    const { getByTestId, getAllByTestId, queryAllByTestId } = render(<Wrapper />);

    await waitForDomChange();

    expect(getAllByTestId("error").map(node => node.textContent)).toEqual([
        "Value is required",
        "Value is required"
    ]);
    expect(getAllByTestId("top-level-error").map(node => node.textContent)).toEqual([
        "contact.firstName - Value is required",
        "contact.lastName - Value is required"
    ]);

    fireEvent.change(getByTestId("firstName"), { target: { value: "Stewart" } });
    fireEvent.change(getByTestId("lastName"), { target: { value: "Anderson" } });

    await waitForDomChange();

    expect(queryAllByTestId("error").map(node => node.textContent)).toEqual([]);
    expect(queryAllByTestId("top-level-error").map(node => node.textContent)).toEqual([]);
});