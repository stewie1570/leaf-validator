import React, { useState } from 'react';
import { render, waitForDomChange } from "@testing-library/react";
import { useLoadingState } from './useLoadingState';

test("should show loading while resolving and then not-loading once resolved", async () => {
    function TestComponent() {
        const [isLoading, showLoadingWhile] = useLoadingState();
        const [resolvedValue, setResolvedValue] = useState("not started");
        const runTheQuery = async () => setResolvedValue(
            await showLoadingWhile(Promise.resolve("resolved value")));

        return <>
            <button onClick={runTheQuery}>Execute</button>
            {isLoading ? <div>Loading...</div> : <div>{resolvedValue}</div>}
        </>;
    }

    const { getByText } = render(<TestComponent />);
    getByText("not started");
    getByText("Execute").click();
    getByText("Loading...");
    await waitForDomChange();
    getByText("resolved value");
});

test("should show loading while resolving and not-loading once rejected", async () => {
    function TestComponent() {
        const [isLoading, showLoadingWhile] = useLoadingState();
        const [resolvedValue, setResolvedValue] = useState("not started");
        const runTheQuery = async () => {
            try {
                setResolvedValue(await showLoadingWhile(Promise.reject("the error")));
            }
            catch (error) {
                setResolvedValue(error);
            }
        }

        return <>
            <button onClick={runTheQuery}>Execute</button>
            {isLoading ? <div>Loading...</div> : <div>{resolvedValue}</div>}
        </>;
    }

    const { getByText } = render(<TestComponent />);
    getByText("not started");
    getByText("Execute").click();
    getByText("Loading...");
    await waitForDomChange();
    getByText("the error");
});