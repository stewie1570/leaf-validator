import React, { createContext, useContext } from "react";

type ContextProvider = ({ children }: any) => JSX.Element;

type UseManagedStateHook<T> = () => T;

export function createManagedContext<T>(
  useManagedState: UseManagedStateHook<T>
): [ContextProvider, UseManagedStateHook<T>] {
  const Context = createContext<T | undefined>(undefined);
  const ContextProvider = ({ children }: any) => {
    const managedState = useManagedState();
    return <Context.Provider value={managedState}>{children}</Context.Provider>;
  };
  const useManagedContext = () => {
    const contextState = useContext(Context);
    const localState = useManagedState();
    return contextState || localState;
  };

  return [ContextProvider, useManagedContext];
}
