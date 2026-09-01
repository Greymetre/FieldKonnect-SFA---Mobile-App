
// import { API_ENDPOINT } from "../ApiUrls";

import { useMutation } from "@tanstack/react-query";
import { loginParmas, signupParmas } from "../../utils/Types";
import axiosClient from "../AxiosClient";
import { API_ENDPOINT } from "../ApiUrls";

export const useMutateLogin = () => {
  return useMutation({
    mutationFn: (payload: loginParmas) =>
      axiosClient.post(API_ENDPOINT.LOGIN, payload),
  });
};

export const logoutApi = () =>
  axiosClient.post(API_ENDPOINT.LOGOUT);

export const useMutateSignup = () => {
  return useMutation({
    mutationFn: (payload: signupParmas) =>
      axiosClient.post(API_ENDPOINT.SIGNUP, payload),
  });
};

// export const useMutateVerifyOTP = () => {
//     return useMutation({
//         mutationFn: (payload: { mobileNumber: number; otp: any }) =>
//             axiosClient.get(
//                 API_ENDPOINT.GET_OTP + `/${payload?.mobileNumber}/${payload?.otp}`
//             ),
//     });
// };


// export const useMutateProviderDetailsAPI = () => {
//     return useMutation({
//         mutationFn: () =>
//             axiosClient.get(
//                 API_ENDPOINT.PROVIDER_DETAILS
//             ),
//     });
// };

// export const useMutateOauthLogin = () => {
//   return useMutation({
//     mutationFn: (payload: loginauthParmas) =>
//       axiosClientForm.post(API_ENDPOINT.OAUTH_TOKEN, payload),
//   });
// };
