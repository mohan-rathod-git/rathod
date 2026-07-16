export interface Profile {
  id: string;
  userId: string;
  name: string;
  age: number;
  location: string;
  occupation: string;
  education: string;
  community: string;
  gotra: string;
  photo: string;
  height: string;
  maritalStatus: string;
  isPremium: boolean;
  isVerified: boolean;
  isOnline: boolean;
  about?: string;
  income?: string;
  motherTongue?: string;
  rashi?: string;
  manglik?: string;
}

export const GOTRAS = [
  "Rathod", "Pawar", "Chavan", "Solanki", "Jadhav", "More", "Shinde", "Bhosale",
  "Gaikwad", "Deshmukh", "Patil", "Naik", "Rane", "Mane", "Kale", "Thorat",
  "Wagh", "Kadam", "Salve", "Sonawane", "Pardeshi", "Tadvi", "Gavit", "Valvi",
  "Padvi", "Vasave", "Kokni", "Dhangar", "Bhil", "Lamani"
];

export const COMMUNITIES = ["Banjara", "Lambani", "Gor", "Sugali", "Banjara Lambani"];

export const STATES = [
  "Andhra Pradesh", "Karnataka", "Maharashtra", "Rajasthan", "Telangana",
  "Madhya Pradesh", "Gujarat", "Tamil Nadu", "Uttar Pradesh", "Bihar"
];
