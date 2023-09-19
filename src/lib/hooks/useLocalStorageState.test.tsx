import React, { useEffect, useRef, useState } from 'react';
import { render, screen, waitFor } from "@testing-library/react";
import { useLocalStorageState } from './useLocalStorageState'

let storage: any = {};
beforeEach(() => {
    Storage.prototype.setItem = (key, value) => storage[key] = value;
    Storage.prototype.getItem = key => storage[key];
});
afterEach(() => { storage = {}; });

function SetStateViaValue() {
    const [state, setState] = useLocalStorageState<string>("StorageKey");

    useEffect(() => {
        state && window.dispatchEvent(new Event("storage"));
    }, [state]);

    return <div>
        {state || "no state"}
        <button onClick={() => setState("expected value")}>Set State</button>
    </div>
}

function SetStateViaCallback() {
    const [state, setState] = useLocalStorageState<string>("StorageKey");
    const callCount = useRef(0);

    useEffect(() => {
        state && callCount.current > 0 && window.dispatchEvent(new Event("storage"));
        callCount.current++;
    }, [state]);

    return <div>
        {state || "no state"}
        <button onClick={() => setState(state => `value: ${JSON.stringify(state)}`)}>Set State</button>
    </div>
}

function Hide({ children }: { children: React.ReactNode }) {
    const [hidden, setHidden] = useState(true);

    return <>
        {hidden
            ? <button onClick={() => setHidden(false)}>Show</button>
            : children}
    </>;
}

beforeEach(() => {
    window.localStorage.clear();
});

test("can update state via value", async () => {
    render(<SetStateViaValue />);

    screen.getByText("no state");
    screen.getByText("Set State").click();
    await screen.findByText("expected value");
});

test("can update state via callback", async () => {
    render(<SetStateViaCallback />);

    screen.getByText("no state");
    screen.getByText("Set State").click();
    await screen.findByText("value: undefined");
});

test("can update common state via value", async () => {
    render(<>
        <SetStateViaValue />
        <SetStateViaValue />
    </>);

    expect(screen.getAllByText("no state").length).toBe(2);
    screen.getAllByText("Set State")[0].click();
    await waitFor(() => {
        expect(screen.getAllByText("expected value").length).toBe(2);
    });
});

test("can update common state via callback", async () => {
    render(<>
        <SetStateViaCallback />
        <SetStateViaCallback />
    </>);

    expect(screen.getAllByText("no state").length).toBe(2);
    screen.getAllByText("Set State")[0].click();
    await waitFor(() => {
        expect(screen.getAllByText("value: undefined").length).toBe(2);
    });
});

test("can update common pre-existing state via callback", async () => {
    window.localStorage.setItem("StorageKey", '"initial"');
    render(<>
        <SetStateViaCallback />
        <SetStateViaCallback />
    </>);

    await waitFor(() => {
        expect(screen.getAllByText("initial").length).toBe(2);
    });
    screen.getAllByText("Set State")[0].click();
    await waitFor(() => {
        expect(screen.getAllByText("value: \"initial\"").length).toBe(2);
    });
});

test("shows proper initial state when local storage key is defined", async () => {
    render(<>
        <SetStateViaValue />
        <Hide>
            <SetStateViaValue />
        </Hide>
    </>);

    expect(screen.getAllByText("no state").length).toBe(1);
    screen.getByText("Set State").click();
    screen.getByText("Show").click();
    await waitFor(() => {
        expect(screen.getAllByText("expected value").length).toBe(2);
    });
});