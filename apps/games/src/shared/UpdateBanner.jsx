import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * A new build installs and takes over as soon as it is downloaded (so nobody is stuck on an old copy),
 * and this banner tells you to reload so the page itself switches to the new version too.
 */
export default function UpdateBanner() {
  const [ready, setReady] = useState(false);
  useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => registration.update().catch(() => {});
      setInterval(check, 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    }
  });
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const hadController = !!navigator.serviceWorker.controller;      // false on a first install
    const onChange = () => { if (hadController) setReady(true); };
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onChange);
  }, []);
  if (!ready) return null;
  return (
    <div className="update-banner" role="status">
      <span>A new version is ready.</span>
      <button className="primary" onClick={() => location.reload()}>Reload</button>
    </div>
  );
}
