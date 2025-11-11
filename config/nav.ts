import type { Locale } from "./site";

export type NavItem = {
  href: string;
  label: string;
};

export type NavConfig = {
  main: NavItem[];
  secondary: NavItem[];
};

export const navConfig: Record<Locale, NavConfig> = {
  en: {
    main: [
      { href: "/licor", label: "Licor" },
      { href: "/aguardente", label: "Aguardente" },
      { href: "/bebida-espirituosa", label: "Bebida Espirituosa" },
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact Us" },
    ],
    secondary: [
      { href: "/account", label: "Account" },
      { href: "/cart", label: "Cart" },
      { href: "/favorites", label: "Favorites" },
    ],
  },
  pt: {
    main: [
      { href: "/licor", label: "Licor" },
      { href: "/aguardente", label: "Aguardente" },
      { href: "/bebida-espirituosa", label: "Bebida Espirituosa" },
      { href: "/about", label: "Sobre Nós" },
      { href: "/contact", label: "Contacte-nos" },
    ],
    secondary: [
      { href: "/account", label: "Conta" },
      { href: "/cart", label: "Carrinho" },
      { href: "/favorites", label: "Favoritos" },
    ],
  },
};
