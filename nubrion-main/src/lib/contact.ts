// One place for the contact e-mail, so every "Napište nám" link stays in sync.
export const EMAIL = "info@nubrion.cz";

/** Opens the visitor's mail app with the address, a subject and a short template filled in. */
export const mailto = (subject = "Poptávka z webu", body = "") =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;

/** The template for the main contact button at the bottom of the page. */
export const CONTACT_MAILTO = mailto(
  "Poptávka z webu",
  "Dobrý den,\n\nrád/a bych se zeptal/a na…\n\nFirma:\nTelefon (nepovinné):\n\nDěkuji",
);
