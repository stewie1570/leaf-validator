import { useEffect } from 'react'
import { useMountedOnlyState as useState } from './useMountedOnlyState'

function getLocalStateFor(storageKey: string) {
    const storageValue = window.localStorage.getItem(storageKey);
    return storageValue ? JSON.parse(storageValue) : undefined;
}

export function useLocalStorageState<T>(storageKey: string): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>] {
    const [state, setState] = useState<T | undefined>(undefined);

    useEffect(() => {
        function loadStorageIntoState() {
            setState(getLocalStateFor(storageKey));
        }

        window.addEventListener('storage', loadStorageIntoState);
        loadStorageIntoState();

        return () => {
            window.removeEventListener('storage', loadStorageIntoState);
        }
    }, [storageKey]);

    function setStorageState(valueOrSetter: React.SetStateAction<T | undefined>) {
        setState(valueOrSetter instanceof Function
            ? state => updateStorageValue(valueOrSetter(state))
            : updateStorageValue(valueOrSetter));

        function updateStorageValue(value: T | undefined): T | undefined {
            window.localStorage.setItem(storageKey, JSON.stringify(value));
            return value;
        }
    }

    return [state, setStorageState];
}