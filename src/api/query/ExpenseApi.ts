import axiosClient from '../AxiosClient';
import axiosClientForm from '../AxiosForm';
import { API_ENDPOINT } from '../ApiUrls';

export type ExpenseListParams = {
  page?: number;
  pageSize?: number;
  start_date?: string;
  end_date?: string;
  expenses_type?: string | number;
  status?: string | number;
  user_id?: string | number;
  payroll_id?: string | number;
};

export const getExpenseTypesApi = (payrollId: string | number) =>
  axiosClient.post(API_ENDPOINT.GET_EXPENSES_TYPE, { payroll_id: payrollId });

export const getMyExpensesApi = (params: ExpenseListParams = {}) =>
  axiosClient.post(API_ENDPOINT.EXPENSE_LISTING, {
    pageSize: 100,
    ...params,
  });

export const getAllExpensesApi = (params: ExpenseListParams = {}) =>
  axiosClient.post(API_ENDPOINT.ALL_EXPENSE_LISTING, {
    pageSize: 100,
    ...params,
  });

export const getExpenseDetailsApi = (expenseId: string | number) =>
  axiosClient.post(API_ENDPOINT.EXPENSE_DETAILS, { expense_id: expenseId });

export const createExpenseApi = (payload: FormData) =>
  axiosClientForm.post(API_ENDPOINT.CREATE_EXPENSE, payload);

export const updateExpenseApi = (payload: FormData) =>
  axiosClientForm.post(API_ENDPOINT.UPDATE_EXPENSE, payload);

export const approveExpenseApi = (payload: {
  expense_id: string | number;
  approve_amnt: string | number;
  reasons?: string;
  reason?: string;
}) => axiosClient.post(API_ENDPOINT.APPROVE_EXPENSE, payload);

export const rejectExpenseApi = (payload: {
  expense_id: string | number;
  reasons: string;
  reason: string;
}) => axiosClient.post(API_ENDPOINT.REJECT_EXPENSE, payload);
