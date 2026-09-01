import axiosClient from '../AxiosClient';
import { API_ENDPOINT } from '../ApiUrls';

export const getLeadStatusSourceApi = () =>
  axiosClient.get('api/getLeadStatusSource');

export const getLeadsApi = (params?: Record<string, any>) =>
  axiosClient.get('api/leads', { params });

export const getLeadDetailsApi = (leadId: string | number) =>
  axiosClient.get('api/leadDetails', { params: { lead_id: leadId } });

export const addLeadNoteApi = (leadId: string | number, note: string) =>
  axiosClient.post('api/addNote', { lead_id: leadId, note });

export const getLeadTaskDropdownsApi = () =>
  axiosClient.get('api/getTaskDropdowns');

export const createLeadTaskApi = (payload: Record<string, any>) =>
  axiosClient.post('api/addleadTask', payload);

export const getLeadOpportunityOptionsApi = (leadId: string | number) =>
  axiosClient.get('api/getLeadContacts', { params: { lead_id: leadId } });

export const createLeadOpportunityApi = (payload: Record<string, any>) =>
  axiosClient.post('api/addLeadopportunity', payload);

export const getAllLeadOpportunitiesApi = (params?: Record<string, any>) =>
  axiosClient.get('api/getAllOpportunities', { params });

export const deleteLeadOpportunityApi = (opportunityId: string | number) =>
  axiosClient.post('api/deleteOpportunity', { opportunity_id: opportunityId });

export const getLeadTasksApi = (params?: Record<string, any>) =>
  axiosClient.get('api/getLeadTasks', { params });

export const getOtherTasksApi = (params?: Record<string, any>) =>
  axiosClient.get('api/getOtherTasks', { params });

export const changeLeadTaskStatusApi = (taskId: string | number, status: string, remark?: string) =>
  axiosClient.post('api/changeTaskStatus', { task_id: taskId, status, remark });

export const changeManagementTaskStatusApi = (taskId: string | number, taskStatus: string, comment: string) =>
  axiosClient.post('api/changeOtherTaskStatus', { task_id: taskId, task_status: taskStatus, comment });

export const checkInLeadApi = (payload: {
  lead_id: string | number;
  checkin_latitude: number;
  checkin_longitude: number;
}) => axiosClient.post('api/leadSubmitCheckin', payload);

export const getLeadCheckinsApi = () =>
  axiosClient.get('api/leadGetCheckin');

export const checkOutLeadApi = (payload: {
  checkin_id: string | number;
  lead_id: string | number;
  checkout_latitude: number;
  checkout_longitude: number;
  description: string;
  visit_type_id?: string | number;
}) => axiosClient.post('api/leadSubmitCheckout', payload);

export const createLeadApi = (payload: Record<string, any>) =>
  axiosClient.post('api/leadCreate', payload);

export const updateLeadApi = (payload: Record<string, any>) =>
  axiosClient.post('api/leadCreate', payload);

export const initiateClickToCallApi = (payload: {
  to: string;
  from?: string;
  lead_id?: string | number;
  lead_name?: string;
}) => axiosClient.post(API_ENDPOINT.CLICK_TO_CALL, payload);

export const getClickToCallStatusApi = (callLogId: string | number) =>
  axiosClient.get(`${API_ENDPOINT.CLICK_TO_CALL_STATUS}/${callLogId}/status`);

export const getMyCallHistoryApi = (params?: Record<string, any>) =>
  axiosClient.get(API_ENDPOINT.MY_CALL_HISTORY, { params });
