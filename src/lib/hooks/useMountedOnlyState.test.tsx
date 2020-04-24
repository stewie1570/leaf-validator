import React, { useState } from 'react'
import { render, waitForDomChange } from '@testing-library/react'
import { useMountedOnlyState } from './useMountedOnlyState';

function manuallyResolvableTask<T>() {
    let resolve = () => { };
    const promise = new Promise<T>(resolver => { resolve = resolver; });

    return { promise, resolve };
}

test("should behave just like useState when component is mounted", async () => {
    const TestComponent = ({ doTask }: { doTask: () => Promise<void> }) => {
        const [state, setState] = useMountedOnlyState("initial state");
        const change = async () => {
            await doTask();
            setState("updated");
        }

        return <>
            {state}
            <button onClick={change}>Change</button>
        </>;
    }

    const { getByText } = render(<TestComponent doTask={() => Promise.resolve()} />);

    getByText("initial state");
    getByText("Change").click();
    await waitForDomChange();
    getByText("updated");
});

test("callback form of useState should behave just like useState when component is mounted", async () => {
    const TestComponent = ({ doTask }: { doTask: () => Promise<void> }) => {
        const [state, setState] = useMountedOnlyState("initial state");
        const change = async () => {
            await doTask();
            setState(originalState => `${originalState} - updated`);
        }

        return <>
            {state}
            <button onClick={change}>Change</button>
        </>;
    }

    const { getByText } = render(<TestComponent doTask={() => Promise.resolve()} />);

    getByText("initial state");
    getByText("Change").click();
    await waitForDomChange();
    getByText("initial state - updated");
});

test("should not set state when component is not mounted", async () => {
    const AsyncStateUpdates = ({ doTask }: { doTask: () => Promise<void> }) => {
        const [state, setState] = useMountedOnlyState("initial state");

        const change = async () => {
            await doTask();
            setState("updated");
        }

        return <>
            {state}
            <button onClick={change}>Change</button>
        </>;
    }

    const ControlledUnmountChild = ({ children }: { children: any }) => {
        const [isChildrenMounted, setIsChildrenMounted] = useState(true);

        return <>
            {isChildrenMounted ? children : "no child components"}
            <button onClick={() => setIsChildrenMounted(false)}>Unmount</button>
        </>;
    }

    const { resolve, promise } = manuallyResolvableTask<void>();
    const { getByText } = render(<ControlledUnmountChild>
        <AsyncStateUpdates doTask={() => promise} />
    </ControlledUnmountChild>);

    getByText("initial state");
    getByText("Change").click();
    getByText("Unmount").click();
    resolve();

    await promise;

    getByText("no child components");
});