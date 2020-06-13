import React, { useState, Dispatch, SetStateAction } from 'react';
import './App.css';
import { Leaf } from './lib/Leaf';
import { useValidationModel } from './lib/hooks/useValidationModel'
import { TextInput } from './TextInput';
import { leafDiff } from './lib/domain';
import { useLoadingState } from './lib/hooks/useLoadingState'

const isRequired = (value: string) => (!value || value.trim() === "") && ["Value is required"];
const isValidEmailAddress = (value: string) => !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value) && [`"${value || ""}" is not a valid email address`];
const isValidPhoneNumber = (value: string) => !/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value) && [`"${value || ""}" is not a valid phone number`];
const doesNotExistYet = (value: string) => new Promise(resolve => setTimeout(() => resolve([`"${value}" resolved invalid.`]), Math.random() * 2000))
    .then(result => {
        console.log(`validated "${value}"`);
        return result;
    });

const form = [
    {
        name: "Deferred Async Validation",
        location: "deferredAsyncValidation",
        validators: [isRequired],
        deferredValidators: [doesNotExistYet]
    },
    { name: "Async Validation", location: "asyncValidation", validators: [doesNotExistYet] },
    { name: "First Name", location: "person.firstName", validators: [isRequired] },
    { name: "Last Name", location: "person.lastName", validators: [isRequired] },
    { name: "Email", location: "person.contact.email", validators: [isRequired, isValidEmailAddress] },
    { name: "Phone Number", location: "person.contact.phoneNumber", validators: [isRequired, isValidPhoneNumber] },
]

const fakeSuccessSubmit = async () => {
    return await new Promise(resolve => setTimeout(() => resolve("successful result..."), 3000));
}

const fakeFailSubmit = async () => {
    return await new Promise((resolve, reject) => setTimeout(() => reject("failed result..."), 3000));
}

function App() {
    const [originalModel, setOriginalModel] = useState();
    const [model, setModel] = useState();
    const validationModel = useValidationModel();
    const [showAllValidation, setShowAllValidation] = useState(false);
    const [isSubmitting, showSubmittingWhile] = useLoadingState();
    const isValidating = validationModel.isValidationInProgress();

    const submit = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        setShowAllValidation(true);

        if (validationModel.getAllErrorsForLocation("person").length === 0) {
            console.log(await showSubmittingWhile(fakeSuccessSubmit()));
            setOriginalModel(model);
        }
    }

    const submitFailire = async () => {
        setShowAllValidation(true);

        if (validationModel.getAllErrorsForLocation("person").length === 0) {
            console.log(await showSubmittingWhile(fakeFailSubmit()));
        }
    }

    return (
        <div className="App">
            <form>
                {formElements(model, setModel, showAllValidation, validationModel)}
                <button className="btn btn-primary" type="submit" disabled={isValidating || isSubmitting} onClick={submit}>Fake Submit Success</button>
                &nbsp;
                <button className="btn btn-secondary" type="button" disabled={isValidating || isSubmitting} onClick={submitFailire}>Fake Submit Failure</button>
                {isValidating && <i>Validating...</i>}
                {isSubmitting && <i>Submitting...</i>}
                <br />
                <div style={{ verticalAlign: "top", display: "inline-block", width: "33%" }}>
                    Model:
                    <pre>
                        {JSON.stringify(model, null, 4)}
                    </pre>
                </div>
                {validationOutput("", validationModel)}
                {validationOutput("person.contact", validationModel)}
                <br />
                <b>Diff</b>
                <pre>
                    {JSON.stringify(leafDiff.from(originalModel).to(model), null, 2)}
                </pre>
            </form>
        </div >
    );
}

function formElements(model: any, setModel: Dispatch<SetStateAction<any>>, showAllValidation: boolean, validationModel: any) {
    return form.map(({ name, ...formElement }, index) => <Leaf
        key={index}
        showErrors={showAllValidation}
        model={model}
        onChange={setModel}
        validationModel={validationModel}
        {...formElement}>
        {(value: string, onChange, onBlur, errors) => <label>
            {name}
            <TextInput value={value} onChange={onChange} onBlur={onBlur} className={`${errors.length > 0 ? "is-invalid " : ""}form-control mb-1`} />
            {errors.length > 0 && <ul className="errors">
                {errors.map((error, index) => <li data-testid="error" key={index}>{error}</li>)}
            </ul>}
        </label>}
    </Leaf>)
}

function validationOutput(location: string, validationModel: any) {
    return <div style={{ verticalAlign: "top", display: "inline-block", width: "33%" }}>
        Validation Model for "{location}":
        <pre>
            {JSON.stringify(validationModel.getAllErrorsForLocation(location), null, 4)}
        </pre>
    </div>
}

export default App;
