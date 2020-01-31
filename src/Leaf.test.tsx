import React, { useState } from 'react'
import { render, fireEvent } from '@testing-library/react'
import { Leaf } from './Leaf'
import { TextInput } from './TextInput'

test("can read & edit model nodes nested inside complex object models and arrays", () => {
    const Wrapper = () => {
        const [model, setModel] = useState({
            lists: {
                emails: [{ email: "stewie1570@gmail.com" }, { email: "something_at_something.com" }]
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
})