import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import React, { forwardRef, useRef } from "react";
import { TextInput } from "../TextInput";
import { inputWithFormSelectionOnFocus, formWithVirtualNestability, submitButtonWithFormSelectionOnClick } from "./NestableForm";

const form = (props: any) => <form {...props} />;
const button = (props: any) => <button {...props} />;
const NestableForm = formWithVirtualNestability(form);
const Input = inputWithFormSelectionOnFocus(TextInput);
const SubmitButton = submitButtonWithFormSelectionOnClick(button);
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

test("should render & click INNER form submit button", async () => {
    let submittedForm: any = undefined;
    render(<NestableForm name="outer">
        <NestableForm name="inner">
            <Input data-testid="inner-input" value="" onChange={noOp} />
            <SubmitButton onClick={() => { submittedForm = "inner"; }}>
                Inner Submit
            </SubmitButton>
        </NestableForm>
        <Input data-testid="outer-input" value="" onChange={noOp} />
        <SubmitButton onClick={() => { submittedForm = "outer"; }}>
            Outer Submit
        </SubmitButton>
    </NestableForm>);

    fireEvent.focus(screen.getByTestId("inner-input"));
    expect((screen.getByText("Inner Submit") as any).type).toBe("submit");
    expect((screen.getByText("Outer Submit") as any).type).toBe("button");
});

test("should render & click OUTER form submit button", async () => {
    let submittedForm: any = undefined;
    render(<NestableForm name="outer">
        <NestableForm name="inner">
            <Input data-testid="inner-input" value="" onChange={noOp} />
            <SubmitButton onClick={() => { submittedForm = "inner"; }}>
                Inner Submit
            </SubmitButton>
        </NestableForm>
        <Input data-testid="outer-input" value="" onChange={noOp} />
        <SubmitButton onClick={() => { submittedForm = "outer"; }}>
            Outer Submit
        </SubmitButton>
    </NestableForm>);

    fireEvent.focus(screen.getByTestId("outer-input"));
    expect((screen.getByText("Inner Submit") as any).type).toBe("button");
    expect((screen.getByText("Outer Submit") as any).type).toBe("submit");
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
    const MyFormNestableInput = inputWithFormSelectionOnFocus(MyInput);

    const TestApp = () => {
        const inputRef = useRef<any>();

        return <>
            <MyFormNestableInput data-testid="input" ref={inputRef} />
            <button onClick={() => inputRef.current.focus()}>set focus</button>
        </>;
    }

    render(<TestApp />);

    screen.getByText("set focus").click();
    expect(document.activeElement).toBe(screen.getByTestId("input"));
})