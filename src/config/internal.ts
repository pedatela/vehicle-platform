const { INTERNAL_SYNC_TOKEN = '', SALES_SERVICE_TOKEN = '' } = process.env;

export const internalConfig = {
  token: INTERNAL_SYNC_TOKEN || SALES_SERVICE_TOKEN
};
