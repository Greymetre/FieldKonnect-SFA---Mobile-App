import axiosClient from '../AxiosClient';

export const getProductCatalogueDocumentsApi = () =>
  axiosClient.get('api/get-field-connet-version');
