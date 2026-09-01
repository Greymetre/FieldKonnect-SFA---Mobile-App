import { createSlice, PayloadAction } from "@reduxjs/toolkit";


export interface IAuthSliceInitialState {
  token: string | null;
  user: any | null;
  activeBg: boolean;
  
}

const initialState: IAuthSliceInitialState = {
  token: null,
  user: null,
  activeBg: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // store complete login response
    setToken: (state, action: PayloadAction<any>) => {
      state.token = action.payload;
    },
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload; // update when API response arrives
    },
    setActiveBg: (state, action: PayloadAction<any>) => {
      state.activeBg = action.payload; // update when API response arrives
    },
    logout: (state) => {
      state.user = null; // clear user on logout
    },
  },
});

export const { setToken, setUser, logout, setActiveBg } = authSlice.actions;
export default authSlice.reducer;
