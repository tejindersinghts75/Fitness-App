import * as WebBrowser from 'expo-web-browser';

export const bookingService = {
  open: async (bookingUrl: string) =>
    WebBrowser.openBrowserAsync(bookingUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      controlsColor: '#F36B21',
    }),
};
