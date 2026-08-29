export type UserRole = 'user' | 'admin';

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type ProfileUpdate = Pick<Profile, 'full_name' | 'phone'>;
