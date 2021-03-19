import { render, screen } from "@testing-library/react"
import React from "react";
import { TextInput } from "../TextInput";
import { withFormSelectionOnFocus, withVirtualNestability } from "./CurrentFormContext";

const NestableForm = withVirtualNestability('form');
const Input = withFormSelectionOnFocus(TextInput);

it.skip("should not render nested forms", () => {
    render(<NestableForm name="outer">
        <NestableForm name="inner">
            <Input data-testid="inner-input" />
        </NestableForm>
        <Input data-testid="outer-input" />
    </NestableForm>);

    expect(screen.getAllByRole("form").length).toBe(1);
})
