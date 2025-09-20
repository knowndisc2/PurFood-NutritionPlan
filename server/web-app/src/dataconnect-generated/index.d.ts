import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddFoodItemToMealData {
  mealEntry_insert: MealEntry_Key;
}

export interface AddFoodItemToMealVariables {
  mealId: UUIDString;
  foodItemId: UUIDString;
  quantity: number;
}

export interface CreateMealData {
  meal_insert: Meal_Key;
}

export interface FoodItem_Key {
  id: UUIDString;
  __typename?: 'FoodItem_Key';
}

export interface GetMyMealsData {
  meals: ({
    id: UUIDString;
    mealName: string;
    mealDate: DateString;
  } & Meal_Key)[];
}

export interface Goal_Key {
  id: UUIDString;
  __typename?: 'Goal_Key';
}

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

export interface MealEntry_Key {
  mealId: UUIDString;
  foodItemId: UUIDString;
  __typename?: 'MealEntry_Key';
}

export interface Meal_Key {
  id: UUIDString;
  __typename?: 'Meal_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateMealRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateMealData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateMealData, undefined>;
  operationName: string;
}
export const createMealRef: CreateMealRef;

export function createMeal(): MutationPromise<CreateMealData, undefined>;
export function createMeal(dc: DataConnect): MutationPromise<CreateMealData, undefined>;

interface GetMyMealsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyMealsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyMealsData, undefined>;
  operationName: string;
}
export const getMyMealsRef: GetMyMealsRef;

export function getMyMeals(): QueryPromise<GetMyMealsData, undefined>;
export function getMyMeals(dc: DataConnect): QueryPromise<GetMyMealsData, undefined>;

interface AddFoodItemToMealRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddFoodItemToMealVariables): MutationRef<AddFoodItemToMealData, AddFoodItemToMealVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddFoodItemToMealVariables): MutationRef<AddFoodItemToMealData, AddFoodItemToMealVariables>;
  operationName: string;
}
export const addFoodItemToMealRef: AddFoodItemToMealRef;

export function addFoodItemToMeal(vars: AddFoodItemToMealVariables): MutationPromise<AddFoodItemToMealData, AddFoodItemToMealVariables>;
export function addFoodItemToMeal(dc: DataConnect, vars: AddFoodItemToMealVariables): MutationPromise<AddFoodItemToMealData, AddFoodItemToMealVariables>;

interface ListFoodItemsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListFoodItemsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListFoodItemsData, undefined>;
  operationName: string;
}
export const listFoodItemsRef: ListFoodItemsRef;

export function listFoodItems(): QueryPromise<ListFoodItemsData, undefined>;
export function listFoodItems(dc: DataConnect): QueryPromise<ListFoodItemsData, undefined>;

