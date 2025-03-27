import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Leaf } from './Leaf';
import { TextInput } from '../TextInput';

test("updates of a Leaf does not cause other parallel Leaf children to re-render", () => {
    // Render counters to track component re-renders
    const renderCounts = {
        leaf1: 0,
        leaf2: 0
    };

    // Component to track renders
    const RenderCounter = ({ id, value, onChange }: { id: keyof typeof renderCounts, value: string, onChange: (value: string) => void }) => {
        renderCounts[id]++;
        return (
            <TextInput
                data-testid={id}
                value={value}
                onChange={(e) => onChange(e)}
            />
        );
    };

    const Wrapper = () => {
        const [model, setModel] = useState({
            field1: "value1",
            field2: "value2"
        });

        return (
            <>
                <Leaf
                    model={model}
                    onChange={setModel}
                    location="field1">
                    {(value: string, onChange) => (
                        <RenderCounter
                            id="leaf1"
                            value={value}
                            onChange={onChange}
                        />
                    )}
                </Leaf>
                <Leaf
                    model={model}
                    onChange={setModel}
                    location="field2">
                    {(value: string, onChange) => (
                        <RenderCounter
                            id="leaf2"
                            value={value}
                            onChange={onChange}
                        />
                    )}
                </Leaf>
            </>
        );
    };

    const { getByTestId } = render(<Wrapper />);

    // Initial render counts
    const initialLeaf1RenderCount = renderCounts.leaf1;
    const initialLeaf2RenderCount = renderCounts.leaf2;

    // Update leaf1
    fireEvent.change(getByTestId("leaf1"), { target: { value: "updated value1" } });

    // Verify leaf1 re-rendered but leaf2 did not
    expect(renderCounts.leaf1).toBeGreaterThan(initialLeaf1RenderCount);
    expect(renderCounts.leaf2).toBe(initialLeaf2RenderCount);
});