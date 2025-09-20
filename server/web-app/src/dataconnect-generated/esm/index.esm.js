import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'server',
  location: 'us-central1'
};

export const createMealRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateMeal');
}
createMealRef.operationName = 'CreateMeal';

export function createMeal(dc) {
  return executeMutation(createMealRef(dc));
}

export const getMyMealsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyMeals');
}
getMyMealsRef.operationName = 'GetMyMeals';

export function getMyMeals(dc) {
  return executeQuery(getMyMealsRef(dc));
}

export const addFoodItemToMealRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddFoodItemToMeal', inputVars);
}
addFoodItemToMealRef.operationName = 'AddFoodItemToMeal';

export function addFoodItemToMeal(dcOrVars, vars) {
  return executeMutation(addFoodItemToMealRef(dcOrVars, vars));
}

export const listFoodItemsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListFoodItems');
}
listFoodItemsRef.operationName = 'ListFoodItems';

export function listFoodItems(dc) {
  return executeQuery(listFoodItemsRef(dc));
}

