/**
 * Implements a facade for fetch, to make things simpler during execution.
 * @param {String} url URL to resource
 * @param {String} method HTTP Method
 * @param {Object} queryParams Query Parameters, as a json Key Value Pair
 * @param {String} username Username for authentication
 * @param {String} password Password for authentication
 * @param {Number} successStatus HTTP Status code on a successful http request
 * @param {Object} json JSON Object Body for the request.
 */
function customFetch({
  url,
  method,
  queryParams,
  username,
  password,
  successStatus,
  json,
  isJsonResponse,
  isTextResponse,
}) {
  let headers = {};

  if (method == "GET") headers["Accept"] = "*/*";

  if (username && password)
    headers["Authorization"] = `Basic ${btoa(`${username}:${password}`)}`;

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  if (queryParams) {
    const uSearchParams = new URLSearchParams();
    for (const key in queryParams) {
      if (queryParams[key]) uSearchParams.set(key, queryParams[key]);
    }
    url += `?${uSearchParams.toString()}`;
  }

  return fetch(url, {
    method,
    mode: "cors",
    credentials: "include",
    redirect: "follow",
    referrerPolicy: "no-referrer",
    headers,
    body:
      method == "POST" || method == "PUT" || method == "PATCH"
        ? JSON.stringify(json, undefined, 2)
        : undefined,
  })
    .then((response) => {
      if (
        response.headers &&
        response.headers.has("X-CSRF-HEADER") &&
        response.headers.has("X-CSRF-TOKEN")
      ) {
      }
      if ((successStatus && response.status != successStatus) || !response.ok) {
        throw response;
      }
      return response;
    })
    .then((response) => {
      if (
        response.headers.get("content-type") == "application/json" ||
        isJsonResponse
      )
        return response.json();
      else if (isTextResponse) return response.text();
      return response;
    })

    .catch((error) => {
      let clone = error;

      if (
        (error || {}).headers &&
        error.headers.get("content-type") == "application/json"
      ) {
        clone = error.clone();
        error.json().then(() => {});
      } else {
      }
      throw clone;
    });
}

/**
 * Implements Fetch with auto retry. This should be a direct replacement for
 * the customFetch function. If the retryOptions.maxRetries is 1, then
 * it returns the executed version of the apiFunc
 * @param apiFunc API Function to retry
 * @param apiParams API Parameters to be passed to the function.
 * @param retryOptions Options to retry with.
 * @returns {Promise} a Promise to handle callbacks
 */
export function fetchWithRetry(apiFunc, apiParams, retryOptions) {
  retryOptions = Object.assign(
    {
      maxRetries: process.env.MAX_RETRIES,
      timeouts: process.env.API_TIMEOUTS,
      useLastTimeout: true,
    },
    retryOptions
  );

  if (retryOptions.maxRetries == 1) {
    return apiFunc(apiParams);
  }

  return new Promise(function (resolve, reject) {
    function fetchRetry(continuePoll, pollingInst) {
      apiFunc(apiParams)
        .then((response) => {
          continuePoll(false);
          resolve(response);
        })
        .catch((response) => {
          if (pollingInst.shouldStop()) {
            continuePoll(false);
            reject(response);
          } else {
            continuePoll();
          }
        });
    }

    const pollingInstance = new Polling(fetchRetry, retryOptions);
    pollingInstance.start();
  });
}

/**
 * Returns a promise which aborts a fetch after timeout has occurred.
 * @param {Promise} apiPromise
 * @param {Number} [timeout=3000] Timeout in milliseconds
 */
export function fetchWithTimeout(apiPromise, timeout = 3000) {
  return Promise.race([
    apiPromise,
    new Promise((resolve, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeout)
    ),
  ]);
}

/**
 * Convenience function to execute a GET request.
 * @param {String} url URL to resource
 * @param {Object} queryParams Query Parameters, as a json Key Value Pair
 * @param {String} username Username for authentication
 * @param {String} password Password for authentication
 * @param {Number} successStatus HTTP Status code on a successful http request
 * @param {Object} json JSON Object Body for the request. For 'GET', if set, this will return the parsed JSON object.
 * @param {Boolean} disableTelemetry Disable Telemetry
 */
export function get({
  url,
  queryParams,
  username,
  password,
  successStatus,
  isJsonResponse = true,
  isTextResponse = false,
  disableTelemetry = false,
  csrfEnabled = false,
}) {
  return customFetch({
    url,
    method: "GET",
    queryParams,
    username,
    password,
    successStatus,
    isJsonResponse,
    isTextResponse,
    disableTelemetry,
    csrfEnabled,
  });
}

/**
 * Convenience function to execute a PUT request.
 * @param {String} url URL to resource
 * @param {Object} queryParams Query Parameters, as a json Key Value Pair
 * @param {String} username Username for authentication
 * @param {String} password Password for authentication
 * @param {Number} successStatus HTTP Status code on a successful http request
 * @param {Object} json JSON Object Body for the request.
 */
export function put({
  url,
  queryParams,
  username,
  password,
  successStatus,
  json,
  isJsonResponse = true,
  isTextResponse = false,
}) {
  return customFetch({
    url,
    method: "PUT",
    queryParams,
    username,
    password,
    successStatus,
    json,
    isJsonResponse,
    isTextResponse,
  });
}

/**
 * Convenience function to execute a POST request.
 * @param {String} url URL to resource
 * @param {Object} queryParams Query Parameters, as a json Key Value Pair
 * @param {String} username Username for authentication
 * @param {String} password Password for authentication
 * @param {Number} successStatus HTTP Status code on a successful http request
 * @param {Object} json JSON Object Body for the request.
 */
export function post({
  url,
  queryParams,
  username,
  password,
  successStatus,
  json,
  isJsonResponse = true,
  isTextResponse = false,
  csrfEnabled = false,
}) {
  return customFetch({
    url,
    method: "POST",
    queryParams,
    username,
    password,
    successStatus,
    json,
    isJsonResponse,
    isTextResponse,
  });
}

export function quote(str) {
  return `"${str}"`;
}
