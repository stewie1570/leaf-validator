import React, { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useErrorHandler } from './useErrorHandler'

type SubError = {
    message: string,
    subMessage: string
};

const HandleStringErrorsTestApp = () => {
    const { errorHandler, errors, clearError } = useErrorHandler();

    return <>
        <ul>
            {errors.map(error => <li
                onClick={() => clearError(error)}
                key={error.message}
                data-testid="test-error">
                {error.message}
            </li>)}
        </ul>
        <button onClick={() => errorHandler(Promise.reject("message string"))}>
            Reject a promise with message string
        </button>
        <button onClick={() => errorHandler(Promise.reject("second message string"))}>
            Reject a promise with second message string
        </button>
    </>;
}

const HandleAndReThrowStringErrorsTestApp = () => {
    const { errorHandleAndReThrow, errors, clearError } = useErrorHandler();
    const [thrownError, setThrownError] = useState<Error>();

    return <>
        {thrownError && `Re-thrown error: ${thrownError}`}
        <ul>
            {errors.map(error => <li
                onClick={() => clearError(error)}
                key={error.message}
                data-testid="test-error">
                {error.message}
            </li>)}
        </ul>
        <button onClick={() =>
            errorHandleAndReThrow(Promise.reject("message string"))
                .catch(setThrownError)}>
            Reject a promise with message string
        </button>
        <button onClick={() =>
            errorHandleAndReThrow(Promise.reject("second message string"))
                .catch(setThrownError)}>
            Reject a promise with second message string
        </button>
    </>;
}

test.each([
    [HandleStringErrorsTestApp],
    [HandleAndReThrowStringErrorsTestApp]
])("can display and clear unique string rejection errors", async (SUT: any) => {
    render(<SUT />);
    (await screen.findByText("Reject a promise with message string")).click();
    (await screen.findByText("Reject a promise with second message string")).click();
    await waitFor(() => expect(screen.getAllByTestId("test-error").map(({ innerHTML }) => innerHTML))
        .toEqual([
            "message string",
            "second message string"
        ]));
    screen.getByText("second message string").click();
    await waitFor(async () => {
        expect((await screen.findAllByTestId("test-error")).map(({ innerHTML }) => innerHTML))
            .toEqual(["message string"]);
    });
});

test("re-throw string error", async () => {
    render(<HandleAndReThrowStringErrorsTestApp />);
    (await screen.findByText("Reject a promise with message string")).click();
    await screen.findByText("Re-thrown error: message string");
});

const HandleRealErrorsTestApp = () => {
    const { errorHandler, errors, clearError } = useErrorHandler();

    return <>
        <ul>
            {errors.map(error => <li
                onClick={() => clearError(error)}
                key={error.message}
                data-testid="test-error">
                {error.message}
            </li>)}
        </ul>
        <button onClick={() => errorHandler(Promise.reject(new Error("message string")))}>
            Reject a promise with message string
        </button>
        <button onClick={() => errorHandler(Promise.reject(new Error("second message string")))}>
            Reject a promise with second message string
        </button>
    </>;
}

const ReThrowRealErrorsTestApp = () => {
    const { errorHandleAndReThrow, errors, clearError } = useErrorHandler();
    const [thrownError, setThrownError] = useState<Error>();

    return <>
        {thrownError && `Re-thrown error: ${thrownError.message}`}
        <ul>
            {errors.map(error => <li
                onClick={() => clearError(error)}
                key={error.message}
                data-testid="test-error">
                {error.message}
            </li>)}
        </ul>
        <button onClick={() =>
            errorHandleAndReThrow(Promise.reject(new Error("message string")))
                .catch(setThrownError)}>
            Reject a promise with message string
        </button>
        <button onClick={() =>
            errorHandleAndReThrow(Promise.reject(new Error("second message string")))
                .catch(setThrownError)}>
            Reject a promise with second message string
        </button>
    </>;
}

test.each([
    [HandleRealErrorsTestApp],
    [ReThrowRealErrorsTestApp]
])("can display and clear unique errors", async (SUT: any) => {
    render(<SUT />);
    (await screen.findByText("Reject a promise with message string")).click();
    (await screen.findByText("Reject a promise with second message string")).click();
    await waitFor(() => expect(screen.getAllByTestId("test-error").map(({ innerHTML }) => innerHTML))
        .toEqual([
            "message string",
            "second message string"
        ]));
    screen.getByText("second message string").click();
    await waitFor(async () => {
        expect((await screen.findAllByTestId("test-error")).map(({ innerHTML }) => innerHTML))
            .toEqual(["message string"]);
    });
});

test("re-throw real error", async () => {
    render(<ReThrowRealErrorsTestApp />);
    (await screen.findByText("Reject a promise with message string")).click();
    await screen.findByText("Re-thrown error: message string");
});

const HandlerReturnTestApp = () => {
    const { errorHandler } = useErrorHandler();
    const [state, setState] = useState("unchanged");
    const performAction = async () => {
        const value = await errorHandler(Promise.resolve("expected value"));
        value && setState(value);
    }

    return <>
        <button onClick={performAction}>Invoke</button>
        <span data-testid="test-value">
            {state}
        </span>
    </>;
};

const ReThrowerReturnTestApp = () => {
    const { errorHandleAndReThrow } = useErrorHandler();
    const [state, setState] = useState("unchanged");
    const performAction = async () => {
        const value = await errorHandleAndReThrow(Promise.resolve("expected value"));
        value && setState(value);
    }

    return <>
        <button onClick={performAction}>Invoke</button>
        <span data-testid="test-value">
            {state}
        </span>
    </>;
};

test.each([
    [HandlerReturnTestApp],
    [ReThrowerReturnTestApp]
])("returns the awaited promise", async (SUT: any) => {
    render(<SUT />);
    screen.getByText("Invoke").click();
    await waitFor(async () => {
        expect((await screen.findByTestId("test-value")).innerHTML).toEqual("expected value");
    });
});

const AdditionalErrorDetailsHandlerTestApp = () => {
    const { errorHandler, errors } = useErrorHandler<SubError>();
    const performAction = () => errorHandler(Promise.reject({
        message: "the message",
        subMessage: "the sub-message"
    }));

    return <>
        <ul>
            {errors.map(error => <li key={error.message}>
                <b>{error.message}</b>
                <span>{error.subMessage}</span>
            </li>)}
        </ul>
        <button onClick={performAction}>Invoke</button>
    </>;
};

const AdditionalErrorDetailsReThrowerTestApp = () => {
    const { errorHandleAndReThrow, errors } = useErrorHandler<SubError>();
    const performAction = () => errorHandleAndReThrow(Promise.reject({
        message: "the message",
        subMessage: "the sub-message"
    })).catch(() => undefined);

    return <>
        <ul>
            {errors.map(error => <li key={error.message}>
                <b>{error.message}</b>
                <span>{error.subMessage}</span>
            </li>)}
        </ul>
        <button onClick={performAction}>Invoke</button>
    </>;
};

test.each([
    [AdditionalErrorDetailsHandlerTestApp],
    [AdditionalErrorDetailsReThrowerTestApp]
])("additional error details are available to be rendered", async (SUT: any) => {
    render(<SUT />);
    screen.getByText("Invoke").click();
    await screen.findByText("the message");
    await screen.findByText("the sub-message");
});