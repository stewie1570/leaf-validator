# leaf-validator

[![Build](https://github.com/stewie1570/leaf-validator/workflows/Node.js%20CI/badge.svg)](https://github.com/stewie1570/leaf-validator/actions?query=workflow%3A%22Node.js+CI%22)
[![Coverage Status](https://coveralls.io/repos/github/stewie1570/leaf-validator/badge.svg?branch=master)](https://coveralls.io/github/stewie1570/leaf-validator?branch=master)
[![npm version](https://badge.fury.io/js/leaf-validator.svg)](https://badge.fury.io/js/leaf-validator)
[![Package Size](https://badgen.net/bundlephobia/minzip/leaf-validator)](https://bundlephobia.com/result?p=leaf-validator)
[![Maintainability](https://api.codeclimate.com/v1/badges/c49423ebf81ddf1542c0/maintainability)](https://codeclimate.com/github/stewie1570/leaf-validator/maintainability)

## Overview

We need a declarative API to immutable models such that:

- Querying a location that doesn't exist in an object should return undefined and should never throw undefined reference errors.
- Setting a value at a location that does not exist in an object should build the object necessary to set the value at that location.
- Help loosen coupling of data from queries and updates.
- Encourage applications to have [Normalized State](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape) trees.

**MongoDB** uses a very similar concept called [Dot Notation](https://docs.mongodb.com/manual/core/document/#dot-notation).

**Redis** encourages a best practice very similar to this concept called [JSONPath](https://redislabs.com/redis-best-practices/data-storage-patterns/object-hash-storage/)

## Why use Leaf-Validator?

Advantages in:

- [State Management](#state-management)
- [Validation](#validation)
- [Backward Compatibility](#backward-compatibility)

Other related features include:

- [Diff Functions](#diff-functions) based on the JSONPath or Dot Notation API & principles.
- [Get & Set pure functions](#get--set-pure-functions) based on the JSONPath or Dot Notation API & principles.
- [Hooks](#hooks) for common problems in React applications.

## State Management

Refer to this example model in the example usage below:

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

Using leaf-validator, you could allow a user to edit phone number in the above model like this:

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

In the above example, calling **setPhoneNumberInModel** is roughly the same as writing and calling this funtion (below) except it will even work when **origModel** is null or undefined etc...

```javascript
function setPhoneNumberInModel(updatedPhoneNumber) {
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

This function could have been written inside a reducer. The point is, you can just declare the location to update and leaf-validator will handle the immutable state progression for you.

**The problems this solves:**

This API/abstraction does not suffer from the problems that set state callback functions and reducers of complex models suffer from:

- **Reusability**: Reducers and set state callback functions for this model would not be re-usable for different parts of this model. So you tend to write a lot of them.
- **Complexity**: Reducers of this model would fail if they attempt to update an object that doesn't exist in the original model.
  - For example: **person** is undefined in the **origModel**. When you spread **origModel.person.contact** you'll experience an undefined reference error unless each part of your reducer tests for undefined.
- **Coupling**: Reducers of this model would need to be completely re-written if/when the model shape changes.

[![Edit Leaf Example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/leaf-example-n0e8v?fontsize=14&hidenavigation=1&theme=dark)

## Validation:

If the **phoneNumber** is invalid that means **contact** is invalid. If **contact** is invalid then **person** is invalid. So the shape of the validation model needs to mirror the shape of the model it validates.

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

So the above code will track the validation state of each leaf.
Now you have a validation model with an API that can tell you if there are errors at any location in the model and if there any errors downstream of a given location.

**Validation Queries**

```jsx
validationModel.getAllErrorsForLocation("person.contact");

//will return all errors (or []) at that location or downstream of that location.

validationModel.get("person.contact");
//will return all errors at that location.
//Note: since in this example there would only be errors
//at the leaf values you would likely use example (below) instead:

validationModel.get("person.contact.phoneNumber");
//keep in mind that the errors for a leaf are passed via the
//children render function parameters as in the example above.
```

**Async Validation**

The functions that you pass to the **validators** attribute can by async. That is supported. However, a lot of the time when you have asynchronous validators you don't want the validators to be run every time the input changes. For example, say you have a text input for user name on a new user registration form. You might have an async validator to make sure the user name isn't already taken. You probably don't want that to run on each keystroke. So we have **deferredValidators**. The **deferredValidators** run **deferMilliseconds** trailing the last onChange. The default **deferMilliseconds** is 500 milliseconds.

```jsx
import { Leaf, useValidationModel } from "leaf-validator";

const [model, setModel] = useState({});
const validationModel = useValidationModel();

<Leaf
  model={model}
  onChange={setModel}
  location="person.userName"
  validationModel={validationModel}
  deferredValidators={[isUserNameAvailable]}
>
  {(userName, setUserName, showErrors, errors) => (
    <label>
      User Name
      <TextInput value={userName} onChange={setUserName} onBlur={showErrors} />
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

How do I know if any of the async validators are still in-flight?

```jsx
validationModel.isValidationInProgress(); //returns boolean
```

## Backward Compatibility

Let's say you update your server side code and your requests to the server are now returning a different shape of model. Using this declarative API you can support backward compatibility because it will support multiple shapes of the model. See example below.

```jsx
import { Leaf } from "leaf-validator";

const [model, setModel] = useState({});

<Leaf
  model={model}
  onChange={setModel}
  location="currentLocation.phoneNumber"
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

This will try to read from the **location** in the model first. If **location** in the model is not available then it will start looking at the **failOverLocations**. Updates are done to **location** in the model.

Now you can run DB migration whenever you want.

## Hooks

**useLoadingState**

```jsx
const [isRunning, showRunningWhile] = useLoadingState();
//or
const [isRunning, showRunningWhile] = useLoadingState({ minLoadingTime: 250 });
//all options are optional...
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

**useErrorHandler**

Error Boundaries are meant to recover the application from an un-renderable (crashed) state.

Very often and especially for most asynchrounous errors you'll want the error handling behavior to
simply inform the user that an attempted operation has failed and allow the user to acknowledge
that failure.

```jsx
const { errorHandler, clearError, errors } = useErrorHandler();

await errorHandler(submitData());
// or
const response = await errorHandler(getData());
// or
await errorHandler(getData().then(useIt));
// or
async function useData(){
  useIt(await getData());
}
await errorHandler(useData());

{errors?.length > 0 && <ul>
    {errors.map(error => <li key={error.message}>
        <button onClick={() => clearError(error)}>X</button>
        {error.message}
    </li>)}
</ul>}
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
        original: "p2 value 1",
      },
    },
  ],
};
const updated = {
  outer: [
    {
      wrapper: {
        changed: "p1 value 2",
        new: "p2 value 1",
      },
    },
  ],
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
          and: ["other", "values"],
        },
      },
    },
  })
).toEqual([
  {
    location: "",
    updatedValue: {
      some: {
        complex: {
          object: {
            with: ["values"],
            and: ["other", "values"],
          },
        },
      },
    },
  },
]);

expect(
  leafDiff.from(null).to({
    some: {
      complex: {
        object: {
          with: ["values"],
          and: ["other", "values"],
        },
      },
    },
  })
).toEqual([
  { location: "some.complex.object.with.0", updatedValue: "values" },
  { location: "some.complex.object.and.0", updatedValue: "other" },
  { location: "some.complex.object.and.1", updatedValue: "values" },
]);
```

**NOTE**: See [this example](https://github.com/stewie1570/mongo-leaf-validator-example) for a simple way to use these diffs to operate Mongo updates.
