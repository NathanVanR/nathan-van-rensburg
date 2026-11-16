import { useRegisterSW } from 'virtual:pwa-register/react';

/** Shows "new version ready" when a fresh build has been downloaded, and reloads into it on tap. */
export default function UpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => registration.update().catch(() => {});
      setInterval(check, 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    }
  });
  if (!needRefresh) return null;
  return (
    <div className="update-banner" role="status">
      <span>A new version is ready.</span>
      <button className="primary" onClick={() => updateServiceWorker(true)}>Reload</button>
    </div>
  );
}
