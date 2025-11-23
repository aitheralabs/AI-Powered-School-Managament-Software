export interface UserSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  darkMode: boolean;
  compactView: boolean;
  profileVisibility: boolean;
  activityStatus: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateSettingsDTO {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  darkMode?: boolean;
  compactView?: boolean;
  profileVisibility?: boolean;
  activityStatus?: boolean;
}
