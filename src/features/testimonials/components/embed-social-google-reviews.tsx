import Script from "next/script";

const embedSocialWidgetId = "f39f3bd783147fcc11f5d57b7637fe755fe81f24";

/**
 * Temporary Google Reviews source while the native Google Business Profile
 * integration is awaiting API approval. Keep this integration isolated so it
 * can be removed without changing the Home layout once the native widget is
 * ready.
 */
export function EmbedSocialGoogleReviews() {
  return (
    <section
      className="bg-[#f4faff] px-5 py-[66px] sm:px-8 lg:px-12 xl:px-[112px]"
      aria-labelledby="google-reviews-title"
    >
      <div className="mx-auto max-w-[1313px]">
        <p className="text-[13px] font-black uppercase leading-[13px] tracking-[0.08em] text-leehov-blue-500">
          Avaliado por quem viaja conosco
        </p>
        <h2
          id="google-reviews-title"
          className="mt-[18px] text-[40px] font-extrabold leading-[46px] text-[#153b5b] sm:text-[42px] sm:leading-[50px]"
        >
          Depoimentos
        </h2>
        <div className="mt-8 overflow-hidden">
          <div
            className="embedsocial-hashtag -mt-[78px]"
            data-ref={embedSocialWidgetId}
          />
        </div>
      </div>
      <Script
        id="EmbedSocialHashtagScript"
        src="https://embedsocial.com/cdn/ht.js"
        strategy="afterInteractive"
      />
    </section>
  );
}
