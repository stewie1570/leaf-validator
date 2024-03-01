import React, { useState } from 'react'
import { render, act } from '@testing-library/react'
import { useMountedOnlyState } from './useMountedOnlyState';

function manuallyResolvableTask<T>() {
    let resolve: any = () => { };
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

    const { getByText, findByText } = render(<TestComponent doTask={() => Promise.resolve()} />);

    getByText("initial state");
    getByText("Change").click();
    await findByText("updated");
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

    const { getByText, findByText } = render(<TestComponent doTask={() => Promise.resolve()} />);

    getByText("initial state");
    getByText("Change").click();
    await findByText("initial state - updated");
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
    act(resolve);

    await promise;

    await getByText("no child components");
});