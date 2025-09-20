const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'server',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const createMealRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateMeal');
}
createMealRef.operationName = 'CreateMeal';
exports.createMealRef = createMealRef;

exports.createMeal = function createMeal(dc) {
  return executeMutation(createMealRef(dc));
};

const getMyMealsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyMeals');
}
getMyMealsRef.operationName = 'GetMyMeals';
exports.getMyMealsRef = getMyMealsRef;

exports.getMyMeals = function getMyMeals(dc) {
  return executeQuery(getMyMealsRef(dc));
};

const addFoodItemToMealRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddFoodItemToMeal', inputVars);
}
addFoodItemToMealRef.operationName = 'AddFoodItemToMeal';
exports.addFoodItemToMealRef = addFoodItemToMealRef;

exports.addFoodItemToMeal = function addFoodItemToMeal(dcOrVars, vars) {
  return executeMutation(addFoodItemToMealRef(dcOrVars, vars));
};

const listFoodItemsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListFoodItems');
}
listFoodItemsRef.operationName = 'ListFoodItems';
exports.listFoodItemsRef = listFoodItemsRef;

exports.listFoodItems = function listFoodItems(dc) {
  return executeQuery(listFoodItemsRef(dc));
};
