# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMyMeals*](#getmymeals)
  - [*ListFoodItems*](#listfooditems)
- [**Mutations**](#mutations)
  - [*CreateMeal*](#createmeal)
  - [*AddFoodItemToMeal*](#addfooditemtomeal)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMyMeals
You can execute the `GetMyMeals` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyMeals(): QueryPromise<GetMyMealsData, undefined>;

interface GetMyMealsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyMealsData, undefined>;
}
export const getMyMealsRef: GetMyMealsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyMeals(dc: DataConnect): QueryPromise<GetMyMealsData, undefined>;

interface GetMyMealsRef {
  ...
  (dc: DataConnect): QueryRef<GetMyMealsData, undefined>;
}
export const getMyMealsRef: GetMyMealsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyMealsRef:
```typescript
const name = getMyMealsRef.operationName;
console.log(name);
```

### Variables
The `GetMyMeals` query has no variables.
### Return Type
Recall that executing the `GetMyMeals` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyMealsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMyMealsData {
  meals: ({
    id: UUIDString;
    mealName: string;
    mealDate: DateString;
  } & Meal_Key)[];
}
```
### Using `GetMyMeals`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyMeals } from '@dataconnect/generated';


// Call the `getMyMeals()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyMeals();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyMeals(dataConnect);

console.log(data.meals);

// Or, you can use the `Promise` API.
getMyMeals().then((response) => {
  const data = response.data;
  console.log(data.meals);
});
```

### Using `GetMyMeals`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyMealsRef } from '@dataconnect/generated';


// Call the `getMyMealsRef()` function to get a reference to the query.
const ref = getMyMealsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyMealsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.meals);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.meals);
});
```

## ListFoodItems
You can execute the `ListFoodItems` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listFoodItems(): QueryPromise<ListFoodItemsData, undefined>;

interface ListFoodItemsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListFoodItemsData, undefined>;
}
export const listFoodItemsRef: ListFoodItemsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listFoodItems(dc: DataConnect): QueryPromise<ListFoodItemsData, undefined>;

interface ListFoodItemsRef {
  ...
  (dc: DataConnect): QueryRef<ListFoodItemsData, undefined>;
}
export const listFoodItemsRef: ListFoodItemsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listFoodItemsRef:
```typescript
const name = listFoodItemsRef.operationName;
console.log(name);
```

### Variables
The `ListFoodItems` query has no variables.
### Return Type
Recall that executing the `ListFoodItems` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListFoodItemsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListFoodItemsData {
  foodItems: ({
    id: UUIDString;
    name: string;
    caloriesPerServing: number;
    proteinPerServing: number;
    carbsPerServing: number;
    fatPerServing: number;
  } & FoodItem_Key)[];
}
```
### Using `ListFoodItems`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listFoodItems } from '@dataconnect/generated';


// Call the `listFoodItems()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listFoodItems();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listFoodItems(dataConnect);

console.log(data.foodItems);

// Or, you can use the `Promise` API.
listFoodItems().then((response) => {
  const data = response.data;
  console.log(data.foodItems);
});
```

### Using `ListFoodItems`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listFoodItemsRef } from '@dataconnect/generated';


// Call the `listFoodItemsRef()` function to get a reference to the query.
const ref = listFoodItemsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listFoodItemsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.foodItems);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.foodItems);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateMeal
You can execute the `CreateMeal` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createMeal(): MutationPromise<CreateMealData, undefined>;

interface CreateMealRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateMealData, undefined>;
}
export const createMealRef: CreateMealRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createMeal(dc: DataConnect): MutationPromise<CreateMealData, undefined>;

interface CreateMealRef {
  ...
  (dc: DataConnect): MutationRef<CreateMealData, undefined>;
}
export const createMealRef: CreateMealRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createMealRef:
```typescript
const name = createMealRef.operationName;
console.log(name);
```

### Variables
The `CreateMeal` mutation has no variables.
### Return Type
Recall that executing the `CreateMeal` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateMealData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateMealData {
  meal_insert: Meal_Key;
}
```
### Using `CreateMeal`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createMeal } from '@dataconnect/generated';


// Call the `createMeal()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createMeal();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createMeal(dataConnect);

console.log(data.meal_insert);

// Or, you can use the `Promise` API.
createMeal().then((response) => {
  const data = response.data;
  console.log(data.meal_insert);
});
```

### Using `CreateMeal`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createMealRef } from '@dataconnect/generated';


// Call the `createMealRef()` function to get a reference to the mutation.
const ref = createMealRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createMealRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.meal_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.meal_insert);
});
```

## AddFoodItemToMeal
You can execute the `AddFoodItemToMeal` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
addFoodItemToMeal(vars: AddFoodItemToMealVariables): MutationPromise<AddFoodItemToMealData, AddFoodItemToMealVariables>;

interface AddFoodItemToMealRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddFoodItemToMealVariables): MutationRef<AddFoodItemToMealData, AddFoodItemToMealVariables>;
}
export const addFoodItemToMealRef: AddFoodItemToMealRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addFoodItemToMeal(dc: DataConnect, vars: AddFoodItemToMealVariables): MutationPromise<AddFoodItemToMealData, AddFoodItemToMealVariables>;

interface AddFoodItemToMealRef {
  ...
  (dc: DataConnect, vars: AddFoodItemToMealVariables): MutationRef<AddFoodItemToMealData, AddFoodItemToMealVariables>;
}
export const addFoodItemToMealRef: AddFoodItemToMealRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addFoodItemToMealRef:
```typescript
const name = addFoodItemToMealRef.operationName;
console.log(name);
```

### Variables
The `AddFoodItemToMeal` mutation requires an argument of type `AddFoodItemToMealVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddFoodItemToMealVariables {
  mealId: UUIDString;
  foodItemId: UUIDString;
  quantity: number;
}
```
### Return Type
Recall that executing the `AddFoodItemToMeal` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddFoodItemToMealData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddFoodItemToMealData {
  mealEntry_insert: MealEntry_Key;
}
```
### Using `AddFoodItemToMeal`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addFoodItemToMeal, AddFoodItemToMealVariables } from '@dataconnect/generated';

// The `AddFoodItemToMeal` mutation requires an argument of type `AddFoodItemToMealVariables`:
const addFoodItemToMealVars: AddFoodItemToMealVariables = {
  mealId: ..., 
  foodItemId: ..., 
  quantity: ..., 
};

// Call the `addFoodItemToMeal()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addFoodItemToMeal(addFoodItemToMealVars);
// Variables can be defined inline as well.
const { data } = await addFoodItemToMeal({ mealId: ..., foodItemId: ..., quantity: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addFoodItemToMeal(dataConnect, addFoodItemToMealVars);

console.log(data.mealEntry_insert);

// Or, you can use the `Promise` API.
addFoodItemToMeal(addFoodItemToMealVars).then((response) => {
  const data = response.data;
  console.log(data.mealEntry_insert);
});
```

### Using `AddFoodItemToMeal`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addFoodItemToMealRef, AddFoodItemToMealVariables } from '@dataconnect/generated';

// The `AddFoodItemToMeal` mutation requires an argument of type `AddFoodItemToMealVariables`:
const addFoodItemToMealVars: AddFoodItemToMealVariables = {
  mealId: ..., 
  foodItemId: ..., 
  quantity: ..., 
};

// Call the `addFoodItemToMealRef()` function to get a reference to the mutation.
const ref = addFoodItemToMealRef(addFoodItemToMealVars);
// Variables can be defined inline as well.
const ref = addFoodItemToMealRef({ mealId: ..., foodItemId: ..., quantity: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addFoodItemToMealRef(dataConnect, addFoodItemToMealVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.mealEntry_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.mealEntry_insert);
});
```

