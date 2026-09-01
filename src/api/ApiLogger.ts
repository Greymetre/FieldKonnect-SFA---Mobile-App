import axios from 'axios';

const REQUEST_STARTED_AT = '__apiLoggerStartedAt';
const FETCH_PATCHED_FLAG = '__fieldKonnectFetchLoggerPatched';
const AXIOS_PATCHED_FLAG = '__fieldKonnectAxiosLoggerPatched';

const maskHeaders = (headers: any) => {
  if (!headers) return headers;

  const source =
    typeof headers?.toJSON === 'function'
      ? headers.toJSON()
      : headers;
  const output: Record<string, any> = {};

  Object.keys(source || {}).forEach(key => {
    const value = source[key];
    output[key] = key.toLowerCase() === 'authorization' ? '<hidden>' : value;
  });

  return output;
};

const previewBody = (body: any) => {
  if (!body) return body;

  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return '<FormData>';
  }

  if (typeof body === 'string') {
    return body.length > 1200 ? `${body.slice(0, 1200)}...` : body;
  }

  return body;
};

const requestUrl = (config: any) => {
  const baseUrl = config?.baseURL || '';
  const url = config?.url || '';
  return `${baseUrl}${url}`;
};

export const attachAxiosLogging = (instance: any, label = 'axios') => {
  if (!instance || instance[AXIOS_PATCHED_FLAG]) return;

  instance[AXIOS_PATCHED_FLAG] = true;

  instance.interceptors.request.use(
    (config: any) => {
      config[REQUEST_STARTED_AT] = Date.now();
      console.log(`[API REQUEST][${label}]`, {
        method: config?.method?.toUpperCase?.(),
        url: requestUrl(config),
        params: config?.params,
        headers: maskHeaders(config?.headers),
        data: previewBody(config?.data),
      });
      return config;
    },
    (error: any) => {
      console.log(`[API REQUEST ERROR][${label}]`, {
        message: error?.message,
        config: {
          method: error?.config?.method?.toUpperCase?.(),
          url: requestUrl(error?.config),
        },
      });
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response: any) => {
      const startedAt = response?.config?.[REQUEST_STARTED_AT];
      console.log(`[API RESPONSE][${label}]`, {
        method: response?.config?.method?.toUpperCase?.(),
        url: requestUrl(response?.config),
        status: response?.status,
        durationMs: startedAt ? Date.now() - startedAt : undefined,
        data: previewBody(response?.data),
      });
      return response;
    },
    (error: any) => {
      const startedAt = error?.config?.[REQUEST_STARTED_AT];
      console.log(`[API RESPONSE ERROR][${label}]`, {
        method: error?.config?.method?.toUpperCase?.(),
        url: requestUrl(error?.config),
        status: error?.response?.status,
        durationMs: startedAt ? Date.now() - startedAt : undefined,
        message: error?.message,
        data: previewBody(error?.response?.data),
      });
      return Promise.reject(error);
    },
  );
};

export const patchFetchLogging = () => {
  const globalScope = globalThis as any;

  if (!globalScope.fetch || globalScope[FETCH_PATCHED_FLAG]) return;

  const originalFetch = globalScope.fetch.bind(globalScope);
  globalScope[FETCH_PATCHED_FLAG] = true;

  globalScope.fetch = async (input: any, init?: any) => {
    const startedAt = Date.now();
    const method = init?.method || input?.method || 'GET';
    const url = typeof input === 'string' ? input : input?.url;

    console.log('[API REQUEST][fetch]', {
      method: method?.toUpperCase?.(),
      url,
      headers: maskHeaders(init?.headers || input?.headers),
      data: previewBody(init?.body),
    });

    try {
      const response = await originalFetch(input, init);
      let data: any = '<unreadable>';

      try {
        const clonedResponse = response.clone();
        const contentType = clonedResponse.headers?.get?.('content-type') || '';
        data = contentType.includes('application/json')
          ? await clonedResponse.json()
          : await clonedResponse.text();
      } catch (readError: any) {
        data = `<failed to read response: ${readError?.message || 'unknown'}>`;
      }

      console.log('[API RESPONSE][fetch]', {
        method: method?.toUpperCase?.(),
        url: response?.url || url,
        status: response?.status,
        durationMs: Date.now() - startedAt,
        data: previewBody(data),
      });

      return response;
    } catch (error: any) {
      console.log('[API RESPONSE ERROR][fetch]', {
        method: method?.toUpperCase?.(),
        url,
        durationMs: Date.now() - startedAt,
        message: error?.message,
      });
      throw error;
    }
  };
};

attachAxiosLogging(axios, 'axios-default');
patchFetchLogging();
