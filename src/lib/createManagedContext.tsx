import React, { createContext, useContext } from "react";

type UseManagedStateHook<TParams, TReturn> = (param?: TParams) => TReturn;

export function createManagedContext<THookParam, THookReturn>(
  useManagedState: UseManagedStateHook<THookParam, THookReturn>
): [React.FC<THookParam>, UseManagedStateHook<THookParam, THookReturn>, React.Context<THookReturn | undefined>] {
  const Context = createContext<THookReturn | undefined>(undefined);
  const ContextProvider = ({ children, ...otherParams }: any) => {
    const managedState = useManagedState(otherParams);
    return <Context.Provider value={managedState}>{children}</Context.Provider>;
  };
  const useManagedContext = () => {
    return useContext(Context);
  };

  return [ContextProvider, args => useManagedContext() ?? useManagedState(args), Context];
}
