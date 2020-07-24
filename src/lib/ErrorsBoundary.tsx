import { Component } from 'react';

type Props = {
    children: (params: {
        errors: Array<Error>,
        clearError: (error: Error) => void
    }) => any
};

type Errors = {
    [key: string]: Error;
};

type State = {
    errors: Errors
}

const filter = (errors: Errors, error: Error) => [{}, ...Object.keys(errors)]
    .reduce((errorsBuffer, key: any) => errors[key] === error
        ? errorsBuffer
        : { ...errorsBuffer, [key]: errors[key] });

const initialState: State = { errors: {} };

export class ErrorsBoundary extends Component<Props, State> {
    state = initialState;

    componentDidCatch(error: Error) {
        this.setState(currentState => ({
            ...currentState,
            errors: {
                ...currentState?.errors,
                [error.message]: error
            }
        }));
    }

    render() {
        return this.props?.children({
            errors: Object.values(this.state?.errors),
            clearError: error => this.setState(currentState => ({
                ...currentState,
                errors: filter(currentState.errors, error)
            }))
        });
    }
}