import { render, screen, waitFor } from "@testing-library/react"
import React, { useState } from "react";
import { ErrorsBoundary } from './ErrorsBoundary'
import { useErrorHandler } from './hooks/useErrorHandler'

beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
});
afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
});
afterEach(() => {
    try {
        expect(console.error).not.toHaveBeenCalled()
    } catch (e) {
        throw new Error(
            `console.error was called unexpectedly (make sure to assert all calls and console.error.mockClear() at the end of the test)`,
        )
    }
});

const Bomb = ({ message }: { message: string }): JSX.Element => {
    throw new Error(message);
}

const SyncError = ({ message }: { message: string }) => {
    const [renderError, setRenderError] = useState<boolean>();

    return renderError ? <Bomb message={message} /> : <button onClick={() => setRenderError(true)}>
        invoke {message}
    </button>;
};

const AsyncError = ({ message }: { message: string }) => {
    const [renderError] = useState<boolean>();
    const errorHandler = useErrorHandler();

    return renderError
        ? <Bomb message={message} />
        : <button onClick={() => errorHandler(() => Promise.reject(new Error(message)))}>
            invoke {message}
        </button>;
};

test("displays unique synchronous errors", async () => {
    render(<ErrorsBoundary>
        {({ errors }) => <>
            <ul>
                {errors.map((error, index) => <li data-testid="error" key={index}>{error.message}</li>)}
            </ul>
            <SyncError message="sync error 1" />
            <SyncError message="sync error 2" />
        </>}
    </ErrorsBoundary>);

    expect(screen.queryAllByTestId("error").map(({ textContent }) => textContent))
        .toEqual([]);
    screen.getByText("invoke sync error 1").click();
    screen.getByText("invoke sync error 1").click();
    screen.getByText("invoke sync error 2").click();
    expect((await screen.findAllByTestId("error")).map(({ textContent }) => textContent))
        .toEqual(['sync error 1', 'sync error 2']);
    console.error.mockClear();
});

test("clears unique synchronous errors", async () => {
    render(<ErrorsBoundary>
        {({ errors, clearError }) => <>
            <ul>
                {errors.map((error, index) => <li key={index}>
                    <span data-testid="error">{error.message}</span>
                    <button onClick={() => clearError(error)}>Clear {error.message}</button>
                </li>)}
            </ul>
            <SyncError message="sync error 1" />
            <SyncError message="sync error 2" />
        </>}
    </ErrorsBoundary>);

    screen.getByText("invoke sync error 1").click();
    screen.getByText("invoke sync error 1").click();
    screen.getByText("invoke sync error 2").click();
    await screen.findAllByTestId("error");
    screen.getByText("Clear sync error 1").click();
    expect((await screen.findAllByTestId("error")).map(({ textContent }) => textContent)).toEqual([
        'sync error 2'
    ]);

    console.error.mockClear();
});

test("displays unique a-synchronous errors", async () => {
    render(<ErrorsBoundary>
        {({ errors }) => <>
            <ul>
                {errors.map((error, index) => <li data-testid="error" key={index}>{error.message}</li>)}
            </ul>
            <AsyncError message="async error 1" />
            <AsyncError message="async error 2" />
        </>}
    </ErrorsBoundary>);

    expect(screen.queryAllByTestId("error").map(({ textContent }) => textContent))
        .toEqual([]);
    screen.getByText("invoke async error 1").click();
    await Promise.resolve();
    screen.getByText("invoke async error 1").click();
    await Promise.resolve();
    screen.getByText("invoke async error 2").click();
    await waitFor(() => expect(screen
        .getAllByTestId("error")
        .map(({ textContent }) => textContent))
        .toEqual(['async error 1', 'async error 2']));
    console.error.mockClear();
});

test("clears unique a-synchronous errors", async () => {
    render(<ErrorsBoundary>
        {({ errors, clearError }) => <>
            <ul>
                {errors.map((error, index) => <li key={index}>
                    <span data-testid="error">{error.message}</span>
                    <button onClick={() => clearError(error)}>Clear {error.message}</button>
                </li>)}
            </ul>
            <AsyncError message="async error 1" />
            <AsyncError message="async error 2" />
        </>}
    </ErrorsBoundary>);

    screen.getByText("invoke async error 1").click();
    await Promise.resolve();
    screen.getByText("invoke async error 1").click();
    await Promise.resolve();
    screen.getByText("invoke async error 2").click();
    await screen.findAllByTestId("error");
    screen.getByText("Clear async error 1").click();
    expect((await screen.findAllByTestId("error")).map(({ textContent }) => textContent)).toEqual([
        'async error 2'
    ]);

    console.error.mockClear();
});