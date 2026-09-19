import * as WebBrowser from 'expo-web-browser';

const bookingReturnUrl = 'fitora://booking-complete';
const bookingPageUrl = 'https://fitness-app-tan-zeta.vercel.app/book';

export const bookingService = {
  open: async (bookingUrl: string) => {
    const fitoraBookingUrl = `${bookingPageUrl}?url=${encodeURIComponent(bookingUrl)}`;
    const result = await WebBrowser.openAuthSessionAsync(fitoraBookingUrl, bookingReturnUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      controlsColor: '#F36B21',
    });

    return result.type === 'success';
  },
};
