/**
 * Telegram WebApp utilities
 */

// Define the WebApp interface based on Telegram Mini Apps API
interface WebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    auth_date: number;
    hash: string;
    start_param?: string;
  };
  version: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setText: (text: string) => void;
    setParams: (params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  close: () => void;
  expand: () => void;
  ready: () => void;
  onEvent: (eventType: string, eventHandler: () => void) => void;
  offEvent: (eventType: string, eventHandler: () => void) => void;
  sendData: (data: string) => void;
  switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void;
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ id: string; type?: string; text: string }> }, callback?: (id: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showScanQrPopup: (params: { text?: string }, callback?: (text: string) => void) => void;
  closeScanQrPopup: () => void;
  readTextFromClipboard: (callback?: (text: string) => void) => void;
  requestWriteAccess: (callback?: (access_granted: boolean) => void) => void;
  requestContact: (callback?: (shared: boolean) => void) => void;
  setHeaderColor: (color: 'bg_color' | 'secondary_bg_color' | string) => void;
  setBackgroundColor: (color: 'bg_color' | 'secondary_bg_color' | string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  isVersionAtLeast: (version: string) => boolean;
  setSwipeAction: (action_color: string, icon: string, callback?: () => void) => void;
  clearSwipeAction: () => void;
}

// Make TypeScript aware of the global window.Telegram.WebApp object
declare global {
  interface Window {
    Telegram?: {
      WebApp?: WebApp;
    };
  }
}

/**
 * Gets the Telegram WebApp instance
 * @returns The WebApp instance or null if not available
 */
export const getTelegramWebApp = (): WebApp | null => {
  if (window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

/**
 * Gets the init data from Telegram WebApp
 * @returns The init data string or null if not available
 */
export const getInitData = (): string | null => {
  const webApp = getTelegramWebApp();
  // return webApp ? webApp.initData : null
return "query_id=AAFaCK5IAwAAAFoIrkgFvAom&user=%7B%22id%22%3A7661815898%2C%22first_name%22%3A%22Nik%22%2C%22last_name%22%3A%22Red%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FO_d6KG5pC3ZikiIM4TniSbgHFEZdv59CG8zBoq3bzV5vQ-ENam_fBijq-w-uy4q5.svg%22%7D&auth_date=1735041263&signature=muUncpLrRItIxCkhxghHHW-OfrgOeBIXV3s9XpbYkL1DlZq-99z6RakPm7ytER_UoXkfxZtML6dz57075PLLCQ&hash=68ecd83817ef0f024abd24e0f5fd7b4c820b353aecbc0814be9eaf04e42b82a2";
    ;
};

/**
 * Gets the init data unsafe object from Telegram WebApp
 * @returns The init data unsafe object or null if not available
 */
export const getInitDataUnsafe = () => {
  const webApp = getTelegramWebApp();
  return webApp ? webApp.initDataUnsafe : null;
};

/**
 * Gets the user information from Telegram WebApp
 * @returns The user information or null if not available
 */
export const getUser = () => {
  const initDataUnsafe = getInitDataUnsafe();
  return initDataUnsafe?.user || null;
};

/**
 * Gets the query ID from Telegram WebApp
 * @returns The query ID or null if not available
 */
export const getQueryId = (): string | null => {
  const initDataUnsafe = getInitDataUnsafe();
  return initDataUnsafe?.query_id || null;
};

/**
 * Gets the start parameter from Telegram WebApp
 * @returns The start parameter or null if not available
 */
export const getStartParam = (): string | null => {
  const initDataUnsafe = getInitDataUnsafe();
  return initDataUnsafe?.start_param || null;
};

/**
 * Notifies Telegram WebApp that the app is ready
 */
export const notifyReadyState = (): void => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.ready();
  }
};

/**
 * Sets up the main button in Telegram WebApp
 * @param text The text to display on the button
 * @param onClick The callback function to execute when the button is clicked
 * @param color Optional color of the button
 * @param textColor Optional text color of the button
 */
export const setupMainButton = (
  text: string,
  onClick: () => void,
  color?: string,
  textColor?: string
): void => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    const { MainButton } = webApp;
    MainButton.setText(text);
    if (color) {
      MainButton.color = color;
    }
    if (textColor) {
      MainButton.textColor = textColor;
    }
    MainButton.onClick(onClick);
    MainButton.show();
  }
};

/**
 * Shows an alert via Telegram WebApp
 * @param message The message to display
 * @param callback Optional callback function to execute after the alert is closed
 */
export const showAlert = (message: string, callback?: () => void): void => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.showAlert(message, callback);
  }
};

/**
 * Shows a confirmation dialog via Telegram WebApp
 * @param message The message to display
 * @param callback Optional callback function to execute after the confirmation is closed
 */
export const showConfirm = (message: string, callback?: (confirmed: boolean) => void): void => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.showConfirm(message, callback);
  }
};

/**
 * Closes the Telegram WebApp
 */
export const closeApp = (): void => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.close();
  }
};

/**
 * Sends data back to the Telegram bot
 * @param data The data to send
 */
export const sendData = (data: string): void => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.sendData(data);
  }
};

/**
 * Gets the viewport height of the Telegram WebApp
 * @returns The viewport height or null if not available
 */
export const getViewportHeight = (): number | null => {
  const webApp = getTelegramWebApp();
  return webApp ? webApp.viewportHeight : null;
};

/**
 * Gets the color scheme of the Telegram WebApp
 * @returns The color scheme or null if not available
 */
export const getColorScheme = (): 'light' | 'dark' | null => {
  const webApp = getTelegramWebApp();
  return webApp ? webApp.colorScheme : null;
};

/**
 * Get theme parameters from Telegram WebApp
 * @returns The theme parameters or null if not available
 */
export const getThemeParams = () => {
  const webApp = getTelegramWebApp();
  return webApp ? webApp.themeParams : null;
};

export default {
  getTelegramWebApp,
  getInitData,
  getInitDataUnsafe,
  getUser,
  getQueryId,
  getStartParam,
  notifyReadyState,
  setupMainButton,
  showAlert,
  showConfirm,
  closeApp,
  sendData,
  getViewportHeight,
  getColorScheme,
  getThemeParams,
};