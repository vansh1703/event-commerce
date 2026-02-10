const API_URL = '/api';

export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isBodyObject =
    options.body &&
    typeof options.body === 'object' &&
    !(options.body instanceof FormData);

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: isBodyObject ? JSON.stringify(options.body) : options.body,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // no JSON body
  }

  if (!response.ok) {
    throw new Error(data?.error || response.statusText || 'Request failed');
  }

  return data;
}
