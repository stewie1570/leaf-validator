# leaf-validator

[![Build](https://travis-ci.org/stewie1570/leaf-validator.svg)](https://travis-ci.org/stewie1570/leaf-validator)
[![Coverage Status](https://coveralls.io/repos/github/stewie1570/leaf-validator/badge.svg?branch=master)](https://coveralls.io/github/stewie1570/leaf-validator?branch=master)
[![npm version](https://badge.fury.io/js/leaf-validator.svg)](https://badge.fury.io/js/leaf-validator)
[![Package Size](https://badgen.net/bundlephobia/min/leaf-validator)](https://bundlephobia.com/result?p=leaf-validator)
[![Maintainability](https://api.codeclimate.com/v1/badges/c49423ebf81ddf1542c0/maintainability)](https://codeclimate.com/github/stewie1570/leaf-validator/maintainability)

ECMAScript Target: **ES2019**

## Philosophy

- There should be a declarative interface to allow navigating objects from the root to any value.
- This declarative interface should allow you to compute the next immutable version of an object to update any value.
- This API should help loosen coupling of data from queries and updates.

**MongoDB** uses a very similar concept called [Dot Notation](https://docs.mongodb.com/manual/core/document/#dot-notation).

**Redis** encourages a best practice very similar to this concept that they just call a ['path'](https://redislabs.com/redis-best-practices/data-storage-patterns/object-hash-storage/)

This declarative API to complex models has **advantages in**:

- [State Management](#state-management)
- [Validation](#validation)
- [Backward Compatibility](#backward-compatibility)

Other related features include:

- [Diff Functions](#diff-functions) based on the 'path' or Dot Notation API & principles.
- [Get & Set pure functions](#get--set-pure-functions) based on the 'path' or Dot Notation API & principles.
- [Hooks](#hooks) for common problems in React applications.

## State Management

Here is an example model:

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

Here is an example set state callback function (below) to update the phone number in the model (above):

```javascript
function onPhoneNumberChange(updatedPhoneNumber) {
  setState((origModel) => ({
    ...origModel,
    person: {
      ...origModel.person,
      contact: {
        ...origModel.person.contact,
        phoneNumber: updatedPhoneNumber,
      },
    },
  }));
}
```

**The Problems:**

Set state callback functions and reducers of complex models suffer from these problems:

- **Reusability**: The reducers are not re-usable for different parts of the model. So you tend to write a lot of them.
- **Complexity**: The reducers will fail if they attempt to update an object that doesn't exist in the original model.
  - For example: **person** is undefined in the **origModel**. When you spread **origModel.person.contact** you'll experience an undefined reference error unless each part of your reducer tests for undefined.
- **Coupling**: The reducers will need to be completely re-written if/when the model shape changes.

**Solution:**

Lets not write reducers or set state callbacks for complex models and just declaratively operate immutable state progression for that same complex model.

```jsx
import { Leaf } from "leaf-validator";

const [model, setModel] = useState({});

<Leaf model={model} onChange={setModel} location="person.contact.phoneNumber">
  {(phoneNumber, setPhoneNumberInModel) => (
    <label>
      Phone Number
      <TextInput value={phoneNumber} onChange={setPhoneNumberInModel} />
    </label>
  )}
</Leaf>;
```

[![Edit Leaf Example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/leaf-example-n0e8v?fontsize=14&hidenavigation=1&theme=dark)

## Validation:

If I updated **phoneNumber** to an invalid phone number then there should be a state somewhere that says the **phoneNumber** is invalid. If the **phoneNumber** is invalid that means **contact** is invalid. If **contact** is invalid then **person** is invalid. So the shape of the validation model needs to mirror the shape of the model it validates.

Lets declaratively update the validation model:

```jsx
import { Leaf, useValidationModel } from "leaf-validator";

const isRequired = (value: string) =>
  (!value || value.trim() === "") && ["Value is required"];
const isValidPhoneNumber = (value: string) =>
  !/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value) && [
    `"${value || ""}" is not a valid phone number`,
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
  {(phoneNumber, setPhoneNumber, showErrors, errors) => (
    <label>
      Phone Number
      <TextInput
        value={phoneNumber}
        onChange={setPhoneNumber}
        onBlur={showErrors}
      />
      {errors.length > 0 && (
        <ul>
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </label>
  )}
</Leaf>;
```
So the above code will track the validation state of each leaf. What if I want to know the validation state of everything downstream of a given location in the model? Here's an example.

```jsx
validationModel.getAllErrorsForLocation("person.contact");

//will return Array<{ location: string, messages: Array<string> }> of all errors (or [] if there are no errors) at that location or downstream of that location.
```

## Backward Compatibility

Here's another hypothetical. You're persisting the same model that you have in a client-side app to a Mongo Database and you've changed the shape of the model. You don't want downtime and you don't want to coordinate DB migrations with code updates. So, lets make the app backward compatible with the previous model shape(s):

```jsx
import { Leaf } from "leaf-validator";

const [model, setModel] = useState({});

<Leaf
  model={model}
  onChange={setModel}
  location="newLocation.phoneNumber"
  failOverLocations={[
    "oldLocation.phoneNumber",
    "olderLocation.phoneNumber",
    "oldestLocation.phoneNumber",
  ]}
>
  {(phoneNumber, setPhoneNumber) => (
    <label>
      Phone Number
      <TextInput value={phoneNumber} onChange={setPhoneNumber} />
    </label>
  )}
</Leaf>;
```

Now you can run DB migration whenever you want.

## Hooks

**useLoadingState**

```jsx
const [isRunning, showRunningWhile] = useLoadingState();
.
.
.
//showRunningWhile will return a promise that rejects or resolves the same value
//that the getDataFromServer() would've resolved on its own.
const response = await showRunningWhile(getDataFromServer());
.
.
.
{isRunning && <span>Running...</span>}
```

**useDeferredEffect**

Same as useEffect but will only fire once per configured milliseconds timeout.

```jsx
useDeferredEffect(
  () => {
    //whatever effect(s) you want
  },
  deferMilliseconds || 500,
  [targetValue, location, deferMilliseconds]
);
```

**useMountedOnlyState**

_(exactly the same as useState except it will not set state when the component is not mounted)_

## Get & Set pure functions

### **Set**: helps create immutable progressions.

**Example:**

```js
const theObject = {
  prop1: {
    prop1: {
      target: "original value",
    },
    prop2: {},
  },
  prop2: {},
};

const progession = set("prop1.prop1.target").to("updated value").in(theObject);
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

## Diff Functions

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
const constructed = [original, ...diffs].reduce((currentValue, diff) =>
  set(diff.location).to(diff.updatedValue).in(currentValue)
);
expect(constructed).toEqual(updated);
```

The **diff** method is especially useful when you need to send a diff of what the user last loaded vs. the user updated model to the server. When updates are done via diffs instead of sending full user updated objects you can avoid race-conditions that could cause concurrent users to overwrite each other.

### **leafDiff**: will do the same as the **diff** function except when a new object is constructed because it didn't exist in the original. Instead of creating that object in one diff this function will create a diff for each leaf in that new object.

**Example (_from a unit test_):**

```js
expect(
  diff.from(null).to({
    some: {
      complex: {
        object: {
          with: ["values"],
          and: ["other", "values"]
        }
      }
    }
  })
).toEqual([
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

expect(
  leafDiff.from(null).to({
    some: {
      complex: {
        object: {
          with: ["values"],
          and: ["other", "values"]
        }
      }
    }
  })
).toEqual([
  { location: "some.complex.object.with.0", updatedValue: "values" },
  { location: "some.complex.object.and.0", updatedValue: "other" },
  { location: "some.complex.object.and.1", updatedValue: "values" }
]);
```

**NOTE**: See [this example](https://github.com/stewie1570/mongo-leaf-validator-example) for a simple way to use these diffs to operate Mongo updates.
