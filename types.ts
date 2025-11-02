export enum Role {
  USER = 'user',
  AI = 'ai',
  ERROR = 'error',
}

export interface Message {
  role: Role;
  content: string;
}

export enum Tone {
  FUNNY = 'Funny',
  ADULT = 'Adult',
  PROFESSIONAL = 'Professional',
  POETIC = 'Poetic',
}

export enum Language {
  TAMIL = 'ta',
  ENGLISH = 'en',
}

export enum InteractionModel {
  CHAT = 'Chat',
  VOICE = 'Voice',
}
