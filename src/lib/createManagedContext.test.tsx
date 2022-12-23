import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { useState } from "react";
import { createManagedContext } from "./createManagedContext";

const [UserContextProvider, useUserContext] = createManagedContext(
    () => {
        const [user, setUser] = useState({ firstName: "", lastName: "" });

        return {
            user,
            setFirstName: (firstName: string) =>
                setUser((user) => ({ ...user, firstName })),
            setLastName: (lastName: string) =>
                setUser((user) => ({ ...user, lastName }))
        };
    }
);

const EditUser = () => {
    const { user, setFirstName, setLastName } = useUserContext();

    return (
        <table>
            <tbody>
                <tr>
                    <td id="firstName">First Name</td>
                    <td>
                        <input
                            aria-labelledby="firstName"
                            type="text"
                            value={user.firstName}
                            onChange={({ target }) => setFirstName(target.value)}
                        />
                    </td>
                </tr>
                <tr>
                    <td id="lastName">Last Name</td>
                    <td>
                        <input
                            aria-labelledby="lastName"
                            type="text"
                            value={user.lastName}
                            onChange={({ target }) => setLastName(target.value)}
                        />
                    </td>
                </tr>
            </tbody>
        </table>
    );
};

const DisplayUser = () => {
    const { user } = useUserContext();
    return (
        <div>
            <div>First Name: {user.firstName}</div>
            <div>Last Name: {user.lastName}</div>
        </div>
    );
};

test("using managed context that's shared by two components in the same provider", () => {
    render(<UserContextProvider>
        <EditUser />
        <DisplayUser />
        <DisplayUser />
    </UserContextProvider>);

    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Doe" } });
    expect(screen.getByLabelText("First Name")).toHaveValue("John");
    expect(screen.getByLabelText("Last Name")).toHaveValue("Doe");
    expect(screen.getAllByText("First Name: John")).toHaveLength(2);
    expect(screen.getAllByText("Last Name: Doe")).toHaveLength(2);
});