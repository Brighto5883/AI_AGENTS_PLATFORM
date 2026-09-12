export type LoginRequest = {
    username: string;
    password: string;
  };
  
  export type LoginResponse = {
    access_token: string;
    token_type: string;
  };

  export interface RegisterPayload {
    email: string;
    password: string;
    phone?: string;
  }
  
  export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
  }