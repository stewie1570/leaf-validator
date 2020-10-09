import React, { useState } from 'react';
import { render, waitForElementToBeRemoved } from "@testing-library/react";
import { useLoadingState } from './useLoadingState';

const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time));

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

    const { getByText, findByText } = render(<TestComponent />);
    getByText("not started");
    getByText("Execute").click();
    getByText("Loading...");
    await findByText("resolved value");
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

    const { getByText, findByText } = render(<TestComponent />);
    getByText("not started");
    getByText("Execute").click();
    getByText("Loading...");
    await findByText("the error");
});

test("should defer showing loading while resolving and then not-loading once resolved", async () => {
    function TestComponent() {
        const [isLoading, showLoadingWhile] = useLoadingState({ defer: 100 });
        const [resolvedValue, setResolvedValue] = useState("not started");
        const runTheQuery = async () => setResolvedValue(
            await showLoadingWhile(wait(200).then(() => Promise.resolve("resolved value"))));

        return <>
            <button onClick={runTheQuery}>Execute</button>
            {isLoading ? <div>Loading...</div> : <div>{resolvedValue}</div>}
        </>;
    }

    const { getByText, findByText } = render(<TestComponent />);
    getByText("not started");
    getByText("Execute").click();
    getByText("not started");
    await findByText("Loading...");
    await findByText("resolved value");
});

test("should show loading state for a minimum amount of time", async () => {
    function TestComponent() {
        const [isLoading, showLoadingWhile] = useLoadingState({ defer: 100, minLoadingTime: 250 });
        const [resolvedValue, setResolvedValue] = useState("not started");
        const runTheQuery = async () => setResolvedValue(
            await showLoadingWhile(wait(200).then(() => Promise.resolve("resolved value"))));

        return <>
            <button onClick={runTheQuery}>Execute</button>
            {isLoading ? <div>Loading...</div> : <div>{resolvedValue}</div>}
        </>;
    }

    const { getByText, findByText } = render(<TestComponent />);
    getByText("not started");
    getByText("Execute").click();
    getByText("not started");
    await findByText("Loading...");
    await findByText("resolved value");
});

test("should show not-loading after deferment once rejected", async () => {
    function TestComponent() {
        const [isLoading, showLoadingWhile] = useLoadingState({ defer: 100 });
        const [resolvedValue, setResolvedValue] = useState("not started");
        const runTheQuery = async () => {
            try {
                setResolvedValue(await showLoadingWhile(wait(200).then(() => Promise.reject("the error"))));
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

    const { getByText, findByText } = render(<TestComponent />);
    getByText("not started");
    getByText("Execute").click();
    await findByText("Loading...");
    await findByText("the error");
});

test("should show loading when task running time is less than deferment time", async () => {
    function TestComponent() {
        const [isLoading, showLoadingWhile] = useLoadingState({ defer: 200 });
        const [resolvedValue, setResolvedValue] = useState("not started");
        const runTheQuery = async () => {
            try {
                setResolvedValue(await showLoadingWhile(wait(100).then(() => "expected value")));
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

    const { getByText, queryByText } = render(<TestComponent />);
    getByText("not started");
    getByText("Execute").click();
    getByText("not started");
    await waitForElementToBeRemoved(() => queryByText("not started"))
    getByText("expected value");
});