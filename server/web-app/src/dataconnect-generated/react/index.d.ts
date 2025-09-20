import { CreateMealData, GetMyMealsData, AddFoodItemToMealData, AddFoodItemToMealVariables, ListFoodItemsData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateMeal(options?: useDataConnectMutationOptions<CreateMealData, FirebaseError, void>): UseDataConnectMutationResult<CreateMealData, undefined>;
export function useCreateMeal(dc: DataConnect, options?: useDataConnectMutationOptions<CreateMealData, FirebaseError, void>): UseDataConnectMutationResult<CreateMealData, undefined>;

export function useGetMyMeals(options?: useDataConnectQueryOptions<GetMyMealsData>): UseDataConnectQueryResult<GetMyMealsData, undefined>;
export function useGetMyMeals(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyMealsData>): UseDataConnectQueryResult<GetMyMealsData, undefined>;

export function useAddFoodItemToMeal(options?: useDataConnectMutationOptions<AddFoodItemToMealData, FirebaseError, AddFoodItemToMealVariables>): UseDataConnectMutationResult<AddFoodItemToMealData, AddFoodItemToMealVariables>;
export function useAddFoodItemToMeal(dc: DataConnect, options?: useDataConnectMutationOptions<AddFoodItemToMealData, FirebaseError, AddFoodItemToMealVariables>): UseDataConnectMutationResult<AddFoodItemToMealData, AddFoodItemToMealVariables>;

export function useListFoodItems(options?: useDataConnectQueryOptions<ListFoodItemsData>): UseDataConnectQueryResult<ListFoodItemsData, undefined>;
export function useListFoodItems(dc: DataConnect, options?: useDataConnectQueryOptions<ListFoodItemsData>): UseDataConnectQueryResult<ListFoodItemsData, undefined>;
