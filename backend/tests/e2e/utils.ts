export const uniqueEmail = (prefix: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${timestamp}-${random}@example.com`;
};

export const loginUser = async (
  request: { post: (url: string, options: { data: { email: string; password: string } }) => Promise<any> },
  email: string,
  password: string
): Promise<string> => {
  const response = await request.post('/api/auth/login', {
    data: { email, password },
  });
  const data = await response.json();
  return data.data.accessToken as string;
};
