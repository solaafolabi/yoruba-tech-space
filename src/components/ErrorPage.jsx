// src/pages/ErrorPage.jsx
import React from "react";
import { useTranslation } from "react-i18next";

export default function ErrorPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith("yo") ? "yo" : "en";

  const title = {
    en: "Oops! Something went wrong 😵",
    yo: "Ẹ̀ṣẹ̀! Ohun kan ti lọ lórí 😵",
  };

  const message = {
    en: "We couldn't find the page you are looking for. Try going back home.",
    yo: "A kò rí ojú-òpó tí o ń wá. Gbìmọ̀ padà sí ile.",
  };

  const buttonText = {
    en: "Go Home 🏠",
    yo: "Padà Sí Ilé 🏠",
  };

  return (
    <div
      className="relative flex flex-col justify-center items-center min-h-screen
                 bg-gradient-to-br from-background-gradientStart to-background-gradientEnd
                 overflow-hidden px-4"
    >
      {/* Floating decorative shapes */}
      <div className="absolute top-10 left-5 w-24 h-24 bg-accent-blue rounded-full opacity-40 animate-pulse-slow"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent-yellow rounded-full opacity-30 animate-pulse-slow"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-accent-green rounded-full opacity-50 animate-bounce-slow"></div>

      {/* Main Text */}
      <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-text-highlight drop-shadow-lg animate-bounce">
        {title[lang]}
      </h1>
      <p className="text-lg md:text-2xl mb-8 text-center text-text-default animate-fadeIn">
        {message[lang]}
      </p>

      {/* Go Home Button with background */}
    <a
  href="/"
  className="inline-block px-6 py-3 
             bg-gradient-to-r from-accent-blue to-accent-yellow 
             text-primary-light font-bold rounded-lg shadow-2xl
             hover:from-accent-yellow hover:to-accent-green hover:text-text-default
             transition-all duration-300 animate-fadeIn delay-200"
>
  {buttonText[lang]}
</a>

      {/* Floating animated text */}
      <span className="absolute top-1/4 left-1/3 text-7xl md:text-9xl font-bold text-accent-red
                       opacity-20 animate-float-slow pointer-events-none select-none">
        404
      </span>
      <span className="absolute bottom-1/4 right-1/3 text-6xl md:text-8xl font-bold text-accent-green
                       opacity-15 animate-float-slower pointer-events-none select-none">
        🤯
      </span>
    </div>
  );
}
