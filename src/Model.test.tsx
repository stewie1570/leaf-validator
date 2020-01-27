import React, { useState } from 'react'
import { render, fireEvent } from '@testing-library/react'
import { Model } from './Model'
import { TextInput } from './TextInput'

test("can read & edit model nodes nested inside complex object models and arrays", () => {
    const Wrapper = () => {
        const [model, setModel] = useState({
            lists: {
                emails: [{ email: "stewie1570@gmail.com" }, { email: "something_at_something.com" }]
            }
        });

        return <Model model={model} onChange={setModel} target="lists.emails">
            {(emailNodes: Array<any>, setEmailNodes) => emailNodes.map((emailNode, index) => <Model
                key={index}
                model={emailNode}
                onChange={update => setEmailNodes(emailNodes.map((orig, i) => i === index ? update : orig))}
                target={`email`}>
                {(email: string, onChange) => <TextInput
                    data-testid={`email${index}`}
                    value={email}
                    onChange={onChange} />}
            </Model>)}
        </Model>
    }

    const { getByTestId } = render(<Wrapper />);

    expect((getByTestId("email0") as HTMLInputElement).value).toBe("stewie1570@gmail.com");
    expect((getByTestId("email1") as HTMLInputElement).value).toBe("something_at_something.com");

    fireEvent.change(getByTestId("email1"), { target: { value: "stewie1570@hotmail.com" } });

    expect((getByTestId("email0") as HTMLInputElement).value).toBe("stewie1570@gmail.com");
    expect((getByTestId("email1") as HTMLInputElement).value).toBe("stewie1570@hotmail.com");
})