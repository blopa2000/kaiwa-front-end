export interface Message {
  id: number;
  content: string;
  created_at: string;
  sender: {
    id: number;
    username: string;
    email: string;
    photo: string | null;
  };
  room: {
    id: number;
  };
}
