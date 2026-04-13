import loginScreen from '../screens/login.html?raw';
import chatScreen from '../screens/chat.html?raw';
import feedbackScreen from '../screens/feedback.html?raw';
import thankyouScreen from '../screens/thankyou.html?raw';
import logoUrl from '../assets/images/logo.png';

async function bootstrapWidget() {
  const screensRoot = document.getElementById('screens-root');
  if (!screensRoot) return;

  screensRoot.innerHTML = [
    loginScreen,
    chatScreen,
    feedbackScreen,
    thankyouScreen,
  ].join('\n');

  const headerLogo = document.getElementById('header-logo');
  if (headerLogo) headerLogo.src = logoUrl;

  await import('./main.js');
}

bootstrapWidget().catch((error) => {
  console.error(error);
});
