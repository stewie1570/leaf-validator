import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react";
import { TextInput } from "../TextInput";
import { inputWithFormSelectionOnFocus, formWithVirtualNestability } from "./CurrentFormContext";

const NestableForm = formWithVirtualNestability('form');
const Input = inputWithFormSelectionOnFocus(TextInput);

test("should render & submit inner form only", async () => {
    let submittedForm: any = undefined;
    render(<NestableForm name="outer" onSubmit={() => { submittedForm = "outer"; }}>
        <NestableForm name="inner" onSubmit={() => { submittedForm = "inner"; }}>
            <Input data-testid="inner-input" />
        </NestableForm>
        <Input data-testid="outer-input" />
    </NestableForm>);

    fireEvent.focus(screen.getByTestId("inner-input"));
    fireEvent.submit(screen.getByTestId("inner-input"));

    await waitFor(() => {
        expect(screen.getAllByRole("form").length).toBe(1);
        expect(submittedForm).toBe("inner");
    });
});

test.skip("should render & submit outer form only", async () => {
    let submittedForm: any = undefined;
    render(<NestableForm name="outer" onSubmit={() => { submittedForm = "outer"; }}>
        <NestableForm name="inner" onSubmit={() => { submittedForm = "inner"; }}>
            <Input data-testid="inner-input" />
        </NestableForm>
        <Input data-testid="outer-input" />
    </NestableForm>);

    fireEvent.focus(screen.getByTestId("outer-input"));
    fireEvent.submit(screen.getByTestId("outer-input"));

    await waitFor(() => {
        expect(screen.getAllByRole("form").length).toBe(1);
        expect(submittedForm).toBe("outer");
    });
});
