import React, { useState } from 'react';
import './App.css';
import { Leaf, useValidationModelFor } from './lib/Leaf';
import { TextInput } from './TextInput';

const isRequired = (value: string) => (!value || value.trim() === "") && ["Value is required"];
const isValidEmailAddress = (value: string) => !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value) && [`"${value || ""}" is not a valid email address`];
const isValidPhoneNumber = (value: string) => !/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value) && [`"${value || ""}" is not a valid phone number`];

const App: React.FC = () => {
    const [model, setModel] = useState({});
    const validationModel = useValidationModelFor(model);
    const [showAllValidation, setShowAllValidation] = useState(false);
    const submit = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        setShowAllValidation(true);
    }

    const form = [
        { name: "First Name", location: "person.firstName", validators: [isRequired] },
        { name: "Last Name", location: "person.lastName", validators: [isRequired] },
        { name: "Email", location: "person.contact.email", validators: [isRequired, isValidEmailAddress] },
        { name: "Phone Number", location: "person.contact.phoneNumber", validators: [isRequired, isValidPhoneNumber] },
    ]

    return (
        <div className="App">
            <form>

                {form.map(({ name, ...formElement }) => <Leaf
                    showErrors={showAllValidation}
                    model={model}
                    onChange={setModel}
                    validationModel={validationModel}
                    {...formElement}>
                    {(email: string, onChange, onBlur, errors) => <label>
                        {name}
                        <TextInput value={email} onChange={onChange} onBlur={onBlur} className={`${errors.length > 0 ? "is-invalid " : ""}form-control mb-1`} />
                        {errors.length > 0 && <ul className="errors">
                            {errors.map((error, index) => <li data-testid="error" key={index}>{error}</li>)}
                        </ul>}
                    </label>}
                </Leaf>)}

                <button className="btn btn-primary" type="submit" onClick={submit}>Submit</button>
                <br />
                <div style={{ verticalAlign: "top", display: "inline-block", width: "33%" }}>
                    Model:
                    <pre>
                        {JSON.stringify(model, null, 4)}
                    </pre>
                </div>
                <div style={{ verticalAlign: "top", display: "inline-block", width: "33%" }}>
                    Validation Query For Model Root:
                    <pre>
                        {JSON.stringify(validationModel.getAllErrorsForLocation(""), null, 4)}
                    </pre>
                </div>
                <div style={{ verticalAlign: "top", display: "inline-block", width: "33%" }}>
                    Validation Query For Person->Contact:
                    <pre>
                        {JSON.stringify(validationModel.getAllErrorsForLocation("person.contact"), null, 4)}
                    </pre>
                </div>
            </form>
        </div >
    );
}

export default App;
