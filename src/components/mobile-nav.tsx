"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fr } from "@/i18n/fr";

const LINKS = [
  ["/", fr.nav.home],
  ["/boutique", fr.nav.shop],
  ["/services", fr.nav.services],
  ["/devis", fr.nav.quote],
  ["/a-propos", fr.nav.about],
  ["/contact", fr.nav.contact],
  ["/compte", fr.nav.account],
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const header = document.querySelector(".site-header");
    const sync = () => {
      const height = header?.getBoundingClientRect().height ?? 0;
      document.documentElement.style.setProperty("--header-height", `${height}px`);
    };
    sync();
    const observer = typeof ResizeObserver === "undefined" || !header ? null : new ResizeObserver(sync);
    if (header && observer) observer.observe(header);
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      observer?.disconnect();
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <>
      <button
        className="nav-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="menu-mobile"
        onClick={() => {
          const header = document.querySelector(".site-header");
          if (header) document.documentElement.style.setProperty("--header-height", `${header.getBoundingClientRect().height}px`);
          setOpen((value) => !value);
        }}
      >
        {open ? "Fermer" : "Menu"}
      </button>
      {open && mounted
        ? createPortal(
            <>
              <button className="mobile-backdrop" type="button" aria-label="Fermer le menu" onClick={() => setOpen(false)} />
              <div id="menu-mobile" className="mobile-panel">
                <div className="wrap">
                  <form action="/boutique" className="field" style={{ paddingTop: "0.8rem" }}>
                    <label htmlFor="q-mobile">Rechercher un équipement</label>
                    <input id="q-mobile" name="q" type="search" placeholder="Nom, référence…" />
                  </form>
                  {LINKS.map(([href, label]) => (
                    <Link key={href} href={href} onClick={() => setOpen(false)}>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
