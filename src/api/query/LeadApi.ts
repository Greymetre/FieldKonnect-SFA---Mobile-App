import axiosClient from '../AxiosClient';
import { API_ENDPOINT } from '../ApiUrls';
import axiosClientForm from '../AxiosForm';

export const getLeadStatusSourceApi = () =>
  axiosClient.get('api/getLeadStatusSource');

export const getLeadsApi = (params?: Record<string, any>) =>
  axiosClient.get('api/leads', { params });

export const getLeadDetailsApi = (leadId: string | number) =>
  axiosClient.get('api/leadDetails', { params: { lead_id: leadId } });

export const addLeadNoteApi = (leadId: string | number, note: string) =>
  axiosClient.post('api/addNote', { lead_id: leadId, note });

export const updateLeadStatusApi = (leadId: string | number, status: string | number, note?: string) =>
  axiosClient.post('api/updateLeadStatus', { lead_id: leadId, status, note });

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

export const getCallFeedbackStatusesApi = () =>
  axiosClient.get('api/call-feedback-statuses');

export const submitCallFeedbackApi = (payload: {
  call_log_id: string | number;
  feedback_status_id: string | number;
  message: string;
}) => axiosClient.post('api/call-feedback', payload);

export const getPendingCallFeedbackApi = () =>
  axiosClient.get('api/pending-call-feedback');

export const getCallLogApi = (callLogId: string | number) =>
  axiosClient.get(`api/call-log/${callLogId}`);

export const getCallTranscriptApi = (callLogId: string | number) =>
  axiosClient.get(`api/call-transcript/${callLogId}`);

export const generateCallTranscriptApi = (callLogId: string | number, regenerate = false) =>
  axiosClient.post(`api/call-transcript/${callLogId}`, { regenerate });

export const getMyCallHistoryApi = (params?: Record<string, any>) =>
  axiosClient.get(API_ENDPOINT.MY_CALL_HISTORY, { params });

// ---- CRM lead flow (same as the web lead page) -------------------------------

/** Contacts with calling progress, call history, tasks, Email/LinkedIn drafts and files. */
export const getLeadFlowApi = (leadId: string | number) =>
  axiosClient.get('api/lead-flow', { params: { lead_id: leadId } });

/** Post-call sheet options: call outcomes, lead types and follow-up channels. */
export const getLeadCallOptionsApi = () =>
  axiosClient.get('api/lead-call-options');

export type CallOutcomePayload = {
  call_log_id: string | number;
  /** Call outcome (Call Done, No Response, Switch Off, Wrong Number, Call Back). */
  call_status: string | number;
  /** Lead type (0 = Pending). */
  status: string | number;
  remark: string;
  /** For "Call Done": whatsapp / linkedin / email, or none. */
  details_via?: string[];
  /** Y-m-dTH:i — needed for "Call Back" or when details must be sent. */
  follow_up_at?: string;
};

export const submitCallOutcomeApi = (payload: CallOutcomePayload) =>
  axiosClient.post('api/call-feedback', payload);

export const getDraftApproversApi = () =>
  axiosClient.get('api/draft-approvers');

export const saveLeadDraftApi = (payload: {
  draft_id?: string | number;
  lead_id?: string | number;
  type?: 'email' | 'linkedin';
  note: string;
  approver_id: string | number;
  /** The lead contact the draft is written for. */
  lead_contact_id: string | number;
}) => axiosClient.post('api/lead-drafts', payload);

export const deleteLeadDraftApi = (draftId: string | number) =>
  axiosClient.post('api/lead-drafts/delete', { draft_id: draftId });

export const getDraftApprovalsApi = (params: { type: 'email' | 'linkedin'; state?: 'pending' | 'changes' | 'approved'; search?: string; page?: number }) =>
  axiosClient.get('api/draft-approvals', { params });

export const approveLeadDraftApi = (draftId: string | number, note?: string) =>
  axiosClient.post('api/draft-approvals/approve', { draft_id: draftId, note });

/** Approver asks for changes: the draft goes back to the agent with this feedback. */
export const sendDraftFeedbackApi = (draftId: string | number, feedback: string) =>
  axiosClient.post('api/draft-approvals/feedback', { draft_id: draftId, feedback });

export const uploadLeadFilesApi = (formData: FormData) =>
  axiosClientForm.post('api/lead-files', formData);

export const deleteLeadFileApi = (mediaId: string | number) =>
  axiosClient.post('api/lead-files/delete', { media_id: mediaId });
