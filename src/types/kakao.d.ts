export {};

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Auth: {
        login: (options: {
          success: (response: { access_token: string }) => void;
          fail: (error: unknown) => void;
        }) => void;
        logout: () => void;
      };
    };
  }
}
