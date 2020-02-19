# leaf-validator

[![Build](https://travis-ci.org/stewie1570/leaf-validator.svg)](https://travis-ci.org/stewie1570/leaf-validator)
[![Codecov](https://img.shields.io/codecov/c/github/stewie1570/leaf-validator)](https://codecov.io/gh/stewie1570/leaf-validator)
[![npm version](https://badge.fury.io/js/leaf-validator.svg)](https://badge.fury.io/js/leaf-validator)
[![Package Size](https://badgen.net/bundlephobia/min/leaf-validator)](https://bundlephobia.com/result?p=leaf-validator@1.1.0)
[![Maintainability](https://api.codeclimate.com/v1/badges/c49423ebf81ddf1542c0/maintainability)](https://codeclimate.com/github/stewie1570/leaf-validator/maintainability)

## Hypothetical:

In a React application, you have this model:

```json
{
    "person": {
        "firstName": "Stewart",
        "lastName": "Anderson",
        "contact": {
            "email": "stewie1570@gmail.com",
            "phoneNumber": "0123456789"
        }
    }
}
```

You have a text input that will create a new immutable state (lets call that a state progression) each time the text input calls an onChange function. You would then need to write a reducer or setState callback function that would look something like this:

```javascript
function onPhoneNumberChange(updatedPhoneNumber) {
    setState(origModel => ({
        ...origModel,
        person: {
            ...origModel.person,
            contact: {
                ...origModel.person.contact,
                phoneNumber: updatedPhoneNumber
            }
        }
    }));
}
```

So the new state progression is created from the inside out (New Phone Number -> New contact -> New Person) and the rest of the properties are spread into the new object and maintain their original references.

## The Problems:
- The reducers are not re-usable for different parts of the model. So you tend to write a lot of them.
- The reducers will fail if they attempt to update an object that doesn't exist in the original model.
    - For example: **person** is undefined in the **origModel**. When you spread **origModel.person.contact** you'll experience an undefined reference error unless each part of your reducer tests for undefined.
- The reducers will need to be completely re-written if/when the model shape changes.

## Validation:

If I updated **phoneNumber** to an invalid phone number then there should be a state somewhere that says the **phoneNumber** is invalid. If the **phoneNumber** is invalid that means **contact** is invalid. If **contact** is invalid then **person** is invalid. So the shape of the validation model needs to mirror the shape of the model it validates.


## Experimental Solution:
Lets declaratively create state progressions and update the validaiton model.

```jsx
import { Leaf, useValidationModelFor } from "leaf-validator";

const isRequired = (value: string) => (!value || value.trim() === "") && ["Value is required"];
const isValidPhoneNumber = (value: string) => !/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value) && [`"${value || ""}" is not a valid phone number`];

const [model, setModel] = useState({});
const validationModel = useValidationModelFor(model);

<Leaf
    model={model}
    onChange={setModel}
    location="person.contact.phoneNumber"
    validationModel={validationModel}
    validators={[isRequired, isValidPhoneNumber]}>
    {(phoneNumber, onChange, onBlur, errors) => <label>
        Phone Number
        <TextInput value={phoneNumber} onChange={onChange} onBlur={onBlur} className={`${errors.length > 0 ? "is-invalid " : ""}form-control mb-1`} />
        {errors.length > 0 && <ul className="errors">
            {errors.map((error, index) => <li data-testid="error" key={index}>{error}</li>)}
        </ul>}
    </label>}
</Leaf>
```

[![Edit Leaf Example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/leaf-example-n0e8v?fontsize=14&hidenavigation=1&theme=dark)