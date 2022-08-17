import type { AppProps } from 'next/app';
import HtmlHead from '../components/Heading';
import '../styles/globals.css';

import Router from 'next/router';

const routeChange = () => {
  // Temporary fix to avoid flash of unstyled content
  // during route transitions. Keep an eye on this
  // issue and remove this code when resolved:
  // https://github.com/vercel/next.js/issues/17464

  const tempFix = () => {
    const allStyleElems = document.querySelectorAll('style[media="x"]');
    allStyleElems.forEach((elem) => {
      elem.removeAttribute('media');
    });
  };
  tempFix();
};

Router.events.on('routeChangeComplete', routeChange);
Router.events.on('routeChangeStart', routeChange);

function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <>
      <HtmlHead />
      <Component {...pageProps} key={router.asPath} />
    </>
  );
}

export default MyApp;
