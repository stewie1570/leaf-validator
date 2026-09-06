import { createContext, useContext, type Context, type FC } from "react";

type UseManagedStateHook<TParams, TReturn> = (param?: TParams) => TReturn;

export function createManagedContext<THookParam, THookReturn>(
  useManagedState: UseManagedStateHook<THookParam, THookReturn>
): [
    FC<THookParam & { children?: any }>,
    UseManagedStateHook<THookParam, THookReturn>,
    Context<THookReturn | undefined>
  ] {
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
