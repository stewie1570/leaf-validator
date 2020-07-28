import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useErrorHandler } from './useErrorHandler'

const StringRejectionErrorsTestApp = () => {
    const { handleErrors, errors, clearError } = useErrorHandler();

    return <>
        <ul>
            {errors.map(error => <li
                onClick={() => clearError(error)}
                key={error.message}
                data-testid="test-error">
                {error.message}
            </li>)}
        </ul>
        <button onClick={() => handleErrors(Promise.reject("message string"))}>
            Reject a promise with message string
        </button>
        <button onClick={() => handleErrors(Promise.reject("second message string"))}>
            Reject a promise with second message string
        </button>
    </>;
}

const ErrorsTestApp = () => {
    const { handleErrors, errors, clearError } = useErrorHandler();

    return <>
        <ul>
            {errors.map(error => <li
                onClick={() => clearError(error)}
                key={error.message}
                data-testid="test-error">
                {error.message}
            </li>)}
        </ul>
        <button onClick={() => handleErrors(Promise.reject(new Error("message string")))}>
            Reject a promise with message string
        </button>
        <button onClick={() => handleErrors(Promise.reject(new Error("second message string")))}>
            Reject a promise with second message string
        </button>
    </>;
}

test("can display and clear unique string rejection errors", async () => {
    render(<StringRejectionErrorsTestApp />);
    (await screen.findByText("Reject a promise with message string")).click();
    (await screen.findByText("Reject a promise with second message string")).click();
    await waitFor(() => expect(screen.getAllByTestId("test-error").map(({ innerHTML }) => innerHTML))
        .toEqual([
            "message string",
            "second message string"
        ]));
    screen.getByText("second message string").click();
    expect((await screen.findAllByTestId("test-error")).map(({ innerHTML }) => innerHTML))
        .toEqual(["message string"]);
});

test("can display and clear unique errors", async () => {
    render(<ErrorsTestApp />);
    (await screen.findByText("Reject a promise with message string")).click();
    (await screen.findByText("Reject a promise with second message string")).click();
    await waitFor(() => expect(screen.getAllByTestId("test-error").map(({ innerHTML }) => innerHTML))
        .toEqual([
            "message string",
            "second message string"
        ]));
    screen.getByText("second message string").click();
    expect((await screen.findAllByTestId("test-error")).map(({ innerHTML }) => innerHTML))
        .toEqual(["message string"]);
});