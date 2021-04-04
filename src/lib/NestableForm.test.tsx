import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import React, { forwardRef, useRef } from "react";
import { TextInput } from "../TextInput";
import { inputWithFormSelectionOnFocus, formWithVirtualNestability } from "./NestableForm";

const form = (props: any) => <form {...props} />;
const NestableForm = formWithVirtualNestability(form);
const Input = inputWithFormSelectionOnFocus(TextInput);
const noOp = () => undefined;

test("should render & submit INNER form only", async () => {
    let submittedForm: any = undefined;
    render(<NestableForm name="outer" onSubmit={() => { submittedForm = "outer"; }}>
        <NestableForm name="inner" onSubmit={() => { submittedForm = "inner"; }}>
            <Input data-testid="inner-input" value="" onChange={noOp} />
        </NestableForm>
        <Input data-testid="outer-input" value="" onChange={noOp} />
    </NestableForm>);

    fireEvent.focus(screen.getByTestId("inner-input"));
    fireEvent.submit(screen.getByTestId("inner-input"));

    await waitFor(() => {
        expect(screen.getAllByRole("form").length).toBe(1);
        expect(submittedForm).toBe("inner");
    });
});

test("should render & submit OUTER form only", async () => {
    let submittedForm: any = undefined;
    render(<NestableForm name="outer" onSubmit={() => { submittedForm = "outer"; }}>
        <NestableForm name="inner" onSubmit={() => { submittedForm = "inner"; }}>
            <Input data-testid="inner-input" value="" onChange={noOp} />
        </NestableForm>
        <Input data-testid="outer-input" value="" onChange={noOp} />
    </NestableForm>);

    fireEvent.focus(screen.getByTestId("outer-input"));
    fireEvent.submit(screen.getByTestId("outer-input"));

    await waitFor(() => {
        expect(screen.getAllByRole("form").length).toBe(1);
        expect(submittedForm).toBe("outer");
    });
});

test("input with form selection doesn't cause a crash when used out of nestable forms", () => {
    render(<Input value="" onChange={noOp} />);
    fireEvent.focus(screen.getByRole("textbox"));
});

test("can reference the wrapped input", () => {
    const MyInput = forwardRef((props: any, ref: any) => <input {...props} ref={ref} />);

    const TestApp = () => {
        const inputRef = useRef<any>();

        return <>
            <MyInput data-testid="input" ref={inputRef} />
            <button onClick={() => inputRef.current.focus()}>set focus</button>
        </>;
    }

    render(<TestApp />);

    screen.getByText("set focus").click();
    expect(document.activeElement).toBe(screen.getByTestId("input"));
})