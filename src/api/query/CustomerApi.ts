import { useMutation } from "@tanstack/react-query";
import axiosClient from "../AxiosClient";
import { API_ENDPOINT } from "../ApiUrls";

export const useMutateCustomerListApi = () => {
    return useMutation({
        mutationFn: ({ search, page }: { search?: string; page?: number }) => {

            const params: Record<string, any> = {
                page: page || 1,
                per_page: 10
            };

            if (search && search.trim().length > 0) {
                params.global_search = search.trim();
            }

            return axiosClient.get(API_ENDPOINT.MASTER_DISTRIBUTOR_GET, { params });
        },
    });
};

export const useMutateCustomerTypeListApi = () => {
    return useMutation({
        mutationFn: ({
            customer_type_id,
            search,
            page,
            pageSize = 5,
            city_name,
            for_user_id,
        }: {
            customer_type_id: string | number;
            search?: string;
            page?: number;
            pageSize?: number;
            city_name?: string;
            for_user_id?: string | number;
        }) => {
            const params: Record<string, any> = {
                customer_type_id,
                page: page || 1,
                pageSize,
            };

            if (search && search.trim().length > 0) {
                params.global_search = search.trim();
            }

            if (city_name) {
                params.city_name = city_name;
            }

            if (for_user_id) {
                params.for_user_id = for_user_id;
            }

            return axiosClient.get(API_ENDPOINT.GET_CUSTOMER_LIST, { params });
        },
    });
};

export const useGetCustomerTypesApi = () => {
    return useMutation({
        mutationFn: () => axiosClient.get(API_ENDPOINT.GET_CUSTOMER_TYPE_LIST),
    });
};

// export const useMutateSecondaryCustListApi = () => {
//   return useMutation({
//     mutationFn: ({ type, search, page }: { type: string; search?: string; page?: number }) => {

//       const params: Record<string, any> = {
//         page: page || 1,
//         per_page: 10
//       };

//       if (search && search.trim().length > 0) {
//         params.global_search = search.trim();
//       }

//       const url = `${API_ENDPOINT.SECONDARY_CUSTOMER_GET}${type}`;

//       return axiosClient.get(url, { params });
//     },
//   });
// };

export const useMutateSecondaryCustListApi = () => {
    return useMutation({
        mutationFn: ({
            type,
            search,
            page,
            status,
            city_name,
            for_user_id
        }: any) => {

            const params: any = {
                page: page || 1,
                per_page: 10,
            };

            if (search?.trim()) {
                params.global_search = search.trim();
            }
            console.log(status, 'statusstatusstatus')
            if (status) {
                params.status = status || 'APPROVED';
            }

            if (city_name) {
                params.city_name = city_name;
            }
            if (for_user_id) {
                params.for_user_id = for_user_id;
            }

            console.log(`${API_ENDPOINT.SECONDARY_CUSTOMER_GET}${type}`,
                { params }, 'saldjfaljsdhfjlashdflasd')

            return axiosClient.get(
                `${API_ENDPOINT.SECONDARY_CUSTOMER_GET}${type}`,
                { params }
            );
        },
    });
};

export const useMutateBeatCustomerList = () => {
    return useMutation({
        mutationFn: ({
            type,
            search,
            page,
            status,
            city_name,
        }: any) => {

            const params: any = {
                page: page || 1,
                per_page: 10,
            };

            if (search?.trim()) {
                params.search = search.trim();
            }
            if (status) {
                params.status = status || 'APPROVED';
            }

            if (city_name) {
                params.city_name = city_name;
            }
            // if (for_user_id) {
            //     params.for_user_id = for_user_id;
            // }

            

            return axiosClient.get(
                `${API_ENDPOINT.GET_BEAT_CUSTOMER_LIST}${type}`,
                { params }
            );
        },
    });
};

export const useGetStateListApi = () => {
    return useMutation({
        mutationFn: () =>
            axiosClient.get(
                API_ENDPOINT.GET_STATE_LIST
            ),
    });
};

export const useGetBeatList = () => {
    return useMutation({
        mutationFn: () =>
            axiosClient.get(
                API_ENDPOINT.GET_BEAT_LIST
            ),
    });
};



export const useGetDistributorsList = () => {
    return useMutation({
        mutationFn: () =>
            axiosClient.get(
                API_ENDPOINT.GET_DISTRIBUTORS_LIST
            ),
    });
};
export const useGetDistrictListApi = () => {
    return useMutation({
        mutationFn: (payload: any) =>
            axiosClient.get(
                API_ENDPOINT.GET_DISTRICT_LIST + `?state_id=${payload}`
            ),
    });
};

export const useGetCityListApi = () => {
    return useMutation({
        mutationFn: (payload: any) =>
            axiosClient.get(
                API_ENDPOINT.GET_CITIES_LIST + `?district_id=${payload}`
            ),
    });
};

export const useGetUserCityListApi = () => {
    return useMutation({
        mutationFn: (payload?: { page?: number; per_page?: number; search?: string }) => {
            const params: Record<string, any> = {
                page: payload?.page || 1,
                per_page: payload?.per_page || 20,
            };

            if (payload?.search?.trim()) {
                params.search = payload.search.trim();
            }

            return axiosClient.get(API_ENDPOINT.GET_USER_CITIES_LIST, { params });
        },
    });
};

export const useGetUserDistrictListApi = () => {
    return useMutation({
        mutationFn: () =>
            axiosClient.get(
                API_ENDPOINT.GET_USER_DISTRICT_LIST
            ),
    });
};



export const useGetPincodeByCityListAPi = () => {
    return useMutation({
        mutationFn: (payload: any) =>
            axiosClient.get(
                API_ENDPOINT.GET_PINCODESBYCITY_LIST + `?city_id=${payload}`
            ),
    });
}

export const useGetPincodeListAPi = () => {
    return useMutation({
        mutationFn: (payload: any) =>
            axiosClient.post(
                API_ENDPOINT.GET_PINCODES_LIST + `?pincode=${payload}`
            ),
    });
};

export const useGetSuperVisorListApi = () => {
    return useMutation({
        mutationFn: () =>
            axiosClient.get(
                API_ENDPOINT.GET_SUPERVISOR_API
            ),
    });
};

// export const useGetAllAttanceReport = () => {
//     return useMutation({
//         mutationFn: (payload?: any) =>
//             axiosClient.get(
//                 API_ENDPOINT.GET_ALL_ATTENDANCE + `?type=${payload}`
//             ),
//     });
// };

export const useGetAllAttanceReport = () => {
    return useMutation({
        mutationFn: async (queryString: any = '') => {
            console.log(queryString, 'queryStringqueryString')
            // queryString example: "?type=leave&search_name=12345&status=1"
            const response = await axiosClient.get(
                API_ENDPOINT.GET_ALL_ATTENDANCE + queryString
            );
            return response;           // or return response.data
        },

        // Optional but very useful in real apps:
        // onSuccess: (data) => console.log("Attendance list loaded"),
        // onError: (err) => console.log("Failed to load attendance", err),
    });
};

export const useGetAttendanceData = () => {
    return useMutation({
        mutationFn: (payload: any) =>
            axiosClient.get(
                API_ENDPOINT.ATTENDANCE_DATA + `${payload}`
            ),
    });
};

export const useGetCustomerData = () => {
    return useMutation({
        mutationFn: (payload: any) =>
            axiosClient.get(
                API_ENDPOINT.MASTER_DISTRIBUTOR + `/${payload}`
            ),
    });
};

export const useGetSecondaryCustomerData = () => {
    return useMutation({
        mutationFn: (payload: { customer_id: any }) =>
            axiosClient.get(
                API_ENDPOINT.GET_CUSTOMER_INFO,
                { params: { customer_id: payload?.customer_id } }
            ),
    });
};

export const useGetTourPlanData = () => {
    return useMutation({
        mutationFn: (payload: { start_date: any, end_date: any, user_id: any }) =>
            axiosClient.get(
                API_ENDPOINT.TOUR_GET_SHOW + `?start_date=${payload?.start_date}&end_date=${payload?.end_date}&user_id=${payload?.user_id}`
            ),
    });
};

export const useGetTodayBeatPlanData = () => {
    return useMutation({
        mutationFn: () =>
            axiosClient.get(
                API_ENDPOINT.BEAT_PLAN_DATA
            ),
    });
};

export const useGetSubmitCheckIN = () => {
    return useMutation({
        mutationFn: (payload: { entity_type: any, entity_id: string, checkin_latitude: any, checkin_longitude: any }) =>
            axiosClient.post(
                API_ENDPOINT.CUSTOMER_CHECKIN, payload
            ),
    });
};

export const useGetUserActivity = () => {
    return useMutation({
        mutationFn: (payload: { user_id: any, date: any }) =>
            axiosClient.post(
                API_ENDPOINT.USER_ACTIVITY, payload
            ),
    });
};

export const useGetSubmitCheckout = () => {
    return useMutation({
        mutationFn: (payload:
            {
                entity_type: any,
                entity_id: any,
                checkout_latitude: any,
                checkout_longitude: any,
                checkin_id: any,
                description: string
            }) =>
            axiosClient.post(
                API_ENDPOINT.CUSTOMER_CHECKOUT, payload
            ),
    });
};

// src/api/query/CustomerApi.ts   (or wherever your mutations live)

export const useChangeAttendanceStatus = () => {
    return useMutation({
        mutationFn: (payload: { attendance_id: string | number; status: 1 | 2 | 3 }) =>
            axiosClient.post(API_ENDPOINT.CHANGE_ATTENDANCE_STATUS, payload),

        // Optional: you can add optimistic updates or refetch logic later
    });
};
