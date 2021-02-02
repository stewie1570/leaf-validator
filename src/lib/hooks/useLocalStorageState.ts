import { useEffect } from 'react'
import { useMountedOnlyState as useState } from './useMountedOnlyState'

function getLocalStateFor(storageKey: string) {
    const storageValue = window.localStorage.getItem(storageKey);
    return storageValue === null ? undefined : JSON.parse(storageValue);
}

export function useLocalStorageState<T>(storageKey: string): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>] {
    const [state, setState] = useState<T | undefined>(undefined);

    useEffect(() => {
        function pullStateFromStorage() {
            setState(getLocalStateFor(storageKey));
        }

        window.addEventListener('storage', pullStateFromStorage);
        pullStateFromStorage();

        return () => {
            window.removeEventListener('storage', pullStateFromStorage);
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