import Image from "next/image";
import { LEEHOV_WHATSAPP_URL } from "@/features/settings/utils";

export function FloatingWhatsAppButton() {
  return (
    <a
      href={LEEHOV_WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com a Leehov pelo WhatsApp"
      className="group fixed bottom-5 right-4 z-40 flex size-[58px] items-center justify-center rounded-full bg-[#25d366] p-1 shadow-[0_14px_34px_rgb(6_42_68_/_28%)] transition duration-300 hover:-translate-y-1 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-leehov-blue-300/55 motion-reduce:transition-none sm:bottom-6 sm:right-6 sm:size-[62px]"
    >
      <Image src="/images/leehov/whatsapp.png" alt="" fill sizes="62px" className="rounded-full object-cover" />
      <span className="pointer-events-none absolute right-[calc(100%+12px)] top-1/2 hidden w-max -translate-y-1/2 rounded-md bg-leehov-navy-950 px-3 py-2 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100 md:block motion-reduce:transition-none">
        Fale conosco no WhatsApp
      </span>
    </a>
  );
}
