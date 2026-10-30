export type RegisterPayload = {
  fullName: string;
  phone: string;
  username: string;
  password: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};