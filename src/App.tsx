import React, { useState } from 'react';
import './App.css';
import { Leaf, useValidationModelFor } from './Leaf';
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

    return (
        <div className="App">
            <form>

                <Leaf
                    showErrors={showAllValidation}
                    model={model}
                    onChange={setModel}
                    location="person.firstName"
                    validationModel={validationModel}
                    validators={[isRequired]}>
                    {(email: string, onChange, onBlur, errors) => <label>
                        First Name
                        <TextInput value={email} onChange={onChange} onBlur={onBlur} className={`${errors.length > 0 ? "is-invalid " : ""}form-control mb-1`} />
                        {errors.length > 0 && <ul className="errors">
                            {errors.map((error, index) => <li data-testid="error" key={index}>{error}</li>)}
                        </ul>}
                    </label>}
                </Leaf>

                <Leaf
                    showErrors={showAllValidation}
                    model={model}
                    onChange={setModel}
                    location="person.lastName"
                    validationModel={validationModel}
                    validators={[isRequired]}>
                    {(email: string, onChange, onBlur, errors) => <label>
                        Last Name
                        <TextInput value={email} onChange={onChange} onBlur={onBlur} className={`${errors.length > 0 ? "is-invalid " : ""}form-control mb-1`} />
                        {errors.length > 0 && <ul className="errors">
                            {errors.map((error, index) => <li data-testid="error" key={index}>{error}</li>)}
                        </ul>}
                    </label>}
                </Leaf>

                <Leaf
                    showErrors={showAllValidation}
                    model={model}
                    onChange={setModel}
                    location="person.contact.email"
                    validationModel={validationModel}
                    validators={[isRequired, isValidEmailAddress]}>
                    {(email: string, onChange, onBlur, errors) => <label>
                        Email Address
                        <TextInput value={email} onChange={onChange} onBlur={onBlur} className={`${errors.length > 0 ? "is-invalid " : ""}form-control mb-1`} />
                        {errors.length > 0 && <ul className="errors">
                            {errors.map((error, index) => <li data-testid="error" key={index}>{error}</li>)}
                        </ul>}
                    </label>}
                </Leaf>

                <Leaf
                    showErrors={showAllValidation}
                    model={model}
                    onChange={setModel}
                    location="person.contact.phoneNumber"
                    validationModel={validationModel}
                    validators={[isRequired, isValidPhoneNumber]}>
                    {(email: string, onChange, onBlur, errors) => <label>
                        Phone Number
                        <TextInput value={email} onChange={onChange} onBlur={onBlur} className={`${errors.length > 0 ? "is-invalid " : ""}form-control mb-1`} />
                        {errors.length > 0 && <ul className="errors">
                            {errors.map((error, index) => <li data-testid="error" key={index}>{error}</li>)}
                        </ul>}
                    </label>}
                </Leaf>

                <button className="btn btn-primary" type="submit" onClick={submit}>Submit</button>
                <br />
                <pre>
                    {JSON.stringify(model, null, 4)}
                </pre>
            </form>
        </div >
    );
}

export default App;
