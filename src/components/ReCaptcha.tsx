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

  // CAPTCHA script loading temporarily disabled for testing
  // TODO: Re-enable when proper reCAPTCHA site key is configured

  const execute = async () => {
    console.log("CAPTCHA button clicked - validation disabled");
    // Always provide a token since validation is disabled
    onToken("validation_disabled_token");
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
