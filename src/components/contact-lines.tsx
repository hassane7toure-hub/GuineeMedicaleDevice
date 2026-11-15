import { phoneHref, whatsappHref } from "@/lib/format";

export function ContactLines({ phone, whatsapp }: { phone: string; whatsapp: string }) {
  const numbers = [...new Set([phone, whatsapp].map((value) => value.trim()).filter(Boolean))];
  if (!numbers.length) return <p>Téléphone à configurer</p>;
  return (
    <>
      {numbers.map((number) => {
        const tel = phoneHref(number);
        const whatsApp = whatsappHref(number);
        return (
          <p key={number}>
            {tel ? <a href={tel}>{number}</a> : number}
            {whatsApp ? <> · <a href={whatsApp}>WhatsApp</a></> : null}
          </p>
        );
      })}
    </>
  );
}
