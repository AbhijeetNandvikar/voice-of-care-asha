import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  MPINSetup: undefined;
  MPINVerify: undefined;
  Initialization: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Dashboard: undefined;
  NewVisit: NavigatorScreenParams<VisitStackParamList>;
  PastVisits: undefined;
  Profile: undefined;
};

// Visit Flow Stack
export type VisitStackParamList = {
  VisitType: undefined;
  MCTSVerify: { visitType: string };
  DaySelect: { 
    visitType: string; 
    beneficiaryId: number; 
    beneficiaryName: string;
    mctsId: string;
  };
  DataCollection: {
    visitType: string;
    beneficiaryId: number;
    dayNumber: number;
    templateId: number;
  };
  Summary: {
    visitId: number;
  };
};

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen Props Types
export type AuthScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  BottomTabScreenProps<MainTabParamList, T>;

export type VisitScreenProps<T extends keyof VisitStackParamList> = 
  NativeStackScreenProps<VisitStackParamList, T>;

export type RootScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

// Declare global navigation types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
