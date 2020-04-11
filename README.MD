# leaf-validator

[![Build](https://travis-ci.org/stewie1570/leaf-validator.svg)](https://travis-ci.org/stewie1570/leaf-validator)
[![Codecov](https://img.shields.io/codecov/c/github/stewie1570/leaf-validator)](https://codecov.io/gh/stewie1570/leaf-validator)
[![npm version](https://badge.fury.io/js/leaf-validator.svg)](https://badge.fury.io/js/leaf-validator)
[![Package Size](https://badgen.net/bundlephobia/min/leaf-validator)](https://bundlephobia.com/result?p=leaf-validator)
[![Maintainability](https://api.codeclimate.com/v1/badges/c49423ebf81ddf1542c0/maintainability)](https://codeclimate.com/github/stewie1570/leaf-validator/maintainability)

## Hypothetical:

You have this model in a React app:

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

## Solution:

Lets not write reducers or set state callbacks and just declaratively operate immutable state progression.

```jsx
import { Leaf } from "leaf-validator";

const [model, setModel] = useState({});

<Leaf
  model={model}
  onChange={setModel}
  location="person.contact.phoneNumber"
>
  {(phoneNumber, onPhoneNumberChange) => (
    <label>
      Phone Number
      <TextInput value={phoneNumber} onChange={onPhoneNumberChange} />
    </label>
  )}
</Leaf>;
```

## Validation:

If I updated **phoneNumber** to an invalid phone number then there should be a state somewhere that says the **phoneNumber** is invalid. If the **phoneNumber** is invalid that means **contact** is invalid. If **contact** is invalid then **person** is invalid. So the shape of the validation model needs to mirror the shape of the model it validates.

## Solution:

Lets declaratively update the validation model.

```jsx
import { Leaf, useValidationModel } from "leaf-validator";

const isRequired = (value: string) =>
  (!value || value.trim() === "") && ["Value is required"];
const isValidPhoneNumber = (value: string) =>
  !/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value) && [
    `"${value || ""}" is not a valid phone number`
  ];

const [model, setModel] = useState({});
const validationModel = useValidationModel();

<Leaf
  model={model}
  onChange={setModel}
  location="person.contact.phoneNumber"
  validationModel={validationModel}
  validators={[isRequired, isValidPhoneNumber]}
>
  {(phoneNumber, onPhoneNumberChange, onBlur, errors) => (
    <label>
      Phone Number
      <TextInput
        value={phoneNumber}
        onChange={onPhoneNumberChange}
        onBlur={onBlur}
      />
      {errors.length > 0 && <ul>
        {errors.map((error, index) => <li key={index}>{error}</li>)}
      </ul>}
    </label>
  )}
</Leaf>;
```

[![Edit Leaf Example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/leaf-example-n0e8v?fontsize=14&hidenavigation=1&theme=dark)

## Immutable Helpers

### **Set**: helps create immutable progressions.

**Example:**

```js
const theObject = {
    prop1: {
        prop1: {
            target: "original value"
        },
        prop2: {}
    },
    prop2: {}
};

const progession = set("prop1.prop1.target")
  .to("updated value")
  .in(theObject);
```

will return the equivalent of:

```js
{
    ...theObject,
    prop1: {
        ...theObject?.prop1,
        prop1: {
            ...theObject?.prop1?.prop1,
            target: "updated value"
        }
    }
}
```

### **Get**: _(see example below)_

**Example:**

```js
let obj = ({
    level1: {
        prop1: "expected value"
    }
};
get("level1.prop1").from(obj);
```

will return the equivalent of:

```js
obj?.level1?.prop1;
```

The difference being that the location of the target value is a string and therefore allows for more dynamic access to the target value.

### **Diff**: will create a list of diffs that define all immutable progressions necessary to go from the original object to an updated object.

The diffs are coheasive with the **set** method such that you could run the diffs via the **set** method on the original object to re-construct the updated object. _(see example below)_

**Example (_from a unit test_):**

```js
const original = {
  outer: [
    {
      wrapper: {
        changed: "p1 value 1",
        original: "p2 value 1"
      }
    }
  ]
};
const updated = {
  outer: [
    {
      wrapper: {
        changed: "p1 value 2",
        new: "p2 value 1"
      }
    }
  ]
};
const diffs = diff.from(original).to(updated);
const constructed = [original, ...diffs]
    .reduce((currentValue, diff) => set(diff.location)
        .to(diff.updatedValue)
        .in(currentValue));
expect(constructed).toEqual(updated);
```

The **diff** method is especially useful when you need to send a diff of what the user last loaded vs. the user updated model to the server. When updates are done via diffs instead of sending full user updated objects you can avoid race-conditions that could cause concurrent users to overwrite each other.


### **leafDiff**: will do the same as the **diff** function except when a new object is constructed because it didn't exist in the original. Instead of creating that object in one diff this function will create a diff for each leaf in that new object.

**Example (_from a unit test_):**

```js
expect(diff.from(null).to({
    some: {
        complex: {
            object: {
                with: ["values"],
                and: ["other", "values"]
            }
        }
    }
})).toEqual([
    {
        location: "",
        updatedValue: {
            some: {
                complex: {
                    object: {
                        with: ["values"],
                        and: ["other", "values"]
                    }
                }
            }
        }
    }
]);

expect(leafDiff.from(null).to({
    some: {
        complex: {
            object: {
                with: ["values"],
                and: ["other", "values"]
            }
        }
    }
})).toEqual([
    { location: "some.complex.object.with.0", updatedValue: "values" },
    { location: "some.complex.object.and.0", updatedValue: "other" },
    { location: "some.complex.object.and.1", updatedValue: "values" }
]);
```