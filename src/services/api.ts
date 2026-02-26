const BASE_URL = 'https://inspection.kwikcheck.in/App/webservice';

export const apiPost = async (
  endpoint: string,
  body: any,
  token?: string
) => {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { TokenID: token } : {}),
    },
    body: JSON.stringify(body),
  });

  return response.json();
};