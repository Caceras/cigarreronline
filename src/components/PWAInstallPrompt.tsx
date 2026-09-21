import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after 5 seconds
      setTimeout(() => setShowPrompt(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white  shadow-2xl border border-line p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-paper-2  flex items-center justify-center flex-shrink-0">
          <span className="font-display italic text-lg text-brass-dark">C</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-ink text-sm">Installera CigarrerOnline</h3>
          <p className="text-xs text-muted mt-0.5">
            Ladda ner som app för bästa upplevelse
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="bg-ink hover:bg-ink-2 text-white text-xs font-medium px-3 py-1.5  transition-colors"
            >
              Installera
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-muted hover:text-stone-700 text-xs px-3 py-1.5 transition-colors"
            >
              Inte nu
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-muted hover:text-ink"
        >
          ×
        </button>
      </div>
    </div>
  );
}
