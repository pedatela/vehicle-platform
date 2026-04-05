const { SALES_SERVICE_URL, SALES_SERVICE_TOKEN } = process.env;

export const salesSyncConfig = {
  baseUrl: SALES_SERVICE_URL ?? '',
  token: SALES_SERVICE_TOKEN ?? ''
};
