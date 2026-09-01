import { reduxMmkvStorage } from './ReduxMmkvStorage';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import {
  PayloadAction,
  combineReducers,
  configureStore,
} from '@reduxjs/toolkit';
import { PersistConfig, persistReducer, persistStore } from 'redux-persist';
import logger from 'redux-logger';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import AuthSlice from './slice/AuthSlice';
// import DateRangeSlice from './slice/DateRangeSlice';

const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: 'fieldConnect-redux-root',
  storage: reduxMmkvStorage,
  stateReconciler: autoMergeLevel2,
  whitelist: ['auth', 'user'],
};

const combinedRootReducer = combineReducers({
  auth: AuthSlice,
  // dateRange: DateRangeSlice,
});

export type RootState = ReturnType<typeof combinedRootReducer>;

const rootReducer = (state: RootState | any, action: PayloadAction) => {
  if (action.type === 'LOGOUT') {
    // check for action type
    state = undefined;
  }
  return combinedRootReducer(state, action);
};

const persistRootReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistRootReducer,
  middleware: gDM => gDM({ serializableCheck: false }).concat(logger),
});

export type AppDispatch = typeof store.dispatch;
export const persistor = persistStore(store);

export default store;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
