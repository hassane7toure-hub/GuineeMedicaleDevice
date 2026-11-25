import Image from "next/image";

export function InfoPoster() {
  return (
    <figure className="poster">
      <Image
        src="/brand/affiche.png"
        alt="Affiche GUINEA MEDICAL DEVICE SHOP - SARL : vente, installation, maintenance et conseil. Quartier Concasseur, commune de Gbessia. Téléphones +224 622 32 58 88 et +224 628 00 09 02. E-mail guineamedshop2026@gmail.com."
        width={819}
        height={544}
      />
      <figcaption>Affiche de présentation. Les coordonnées du site en sont reprises.</figcaption>
    </figure>
  );
}
