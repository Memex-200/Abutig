import React, { useEffect, useRef } from "react";

interface ReCaptchaProps {
  siteKey: string;
  action?: string;
  onToken: (token: string) => void;
}

declare global {
  interface Window {
    grecaptcha?: any;
  }
}

const ReCaptcha: React.FC<ReCaptchaProps> = ({
  siteKey,
  action = "submit",
  onToken,
}) => {
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (window.grecaptcha) return;
    if (scriptLoadedRef.current) return;
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    scriptLoadedRef.current = true;
    return () => {
      // script removal optional
    };
  }, [siteKey]);

  const execute = async () => {
    if (!window.grecaptcha) return;
    await window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(siteKey, { action });
        onToken(token);
      } catch {}
    });
  };

  return (
    <button
      type="button"
      onClick={execute}
      className="px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
    >
      أنا لست روبوتاً
    </button>
  );
};

export default ReCaptcha;
