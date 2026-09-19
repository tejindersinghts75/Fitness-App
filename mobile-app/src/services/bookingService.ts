import * as WebBrowser from 'expo-web-browser';

const bookingReturnUrl = 'fitora://booking-complete';

export const bookingService = {
  open: async (bookingUrl: string) => {
    const result = await WebBrowser.openAuthSessionAsync(bookingUrl, bookingReturnUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      controlsColor: '#F36B21',
    });

    return result.type === 'success';
  },
};
