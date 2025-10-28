import type { Locale } from "@/config/site";

export type Dictionary = {
  nav: {
    searchPlaceholder: string;
    cart: string;
    favorites: string;
    account: string;
  };
  banner: {
    freeShipping: string;
  };
  ageGate: {
    title: string;
    description: string;
    confirm: string;
    deny: string;
    deniedTitle: string;
    deniedDescription: string;
  };
  home: {
    heroHeading: string;
    heroSubheading: string;
    shopNow: string;
    exploreCollections: string;
    featuredTitle: string;
    featuredDescription: string;
    categories: {
      licor: string;
      aguardente: string;
      bebidaEspirituosa: string;
    };
  };
  about: {
    heading: string;
    missionTitle: string;
    missionDescription: string;
    craftsmanshipTitle: string;
    craftsmanshipDescription: string;
    heritageTitle: string;
    heritageDescription: string;
  };
  contact: {
    heading: string;
    subheading: string;
    form: {
      name: string;
      email: string;
      message: string;
      submit: string;
      success: string;
    };
  };
  account: {
    heading: string;
    subheading: string;
    email: string;
    password: string;
    login: string;
    createAccount: string;
  };
  cart: {
    heading: string;
    empty: string;
    subtotal: string;
    discount: string;
    delivery: string;
    total: string;
    vatIncluded: string;
    checkout: string;
    continueShopping: string;
    addAllFavorites: string;
    remove: string;
    cleared: string;
    clearButton: string;
  };
  favorites: {
    heading: string;
    empty: string;
    moveToCart: string;
    clear: string;
  };
  footer: {
    newsletterTitle: string;
    newsletterDescription: string;
    emailPlaceholder: string;
    submit: string;
    legalLinks: {
      privacy: string;
      terms: string;
      cookies: string;
    };
    rights: string;
  };
  product: {
    quantity: string;
    addToCart: string;
    addToFavorites: string;
    removeFromFavorites: string;
    description: string;
    relatedItems: string;
    categoryLabel: string;
  };
  catalog: {
    heading: string;
    searchLabel: string;
    searchPlaceholder: string;
    clearSearch: string;
    sortLabel: string;
    priceSort: {
      asc: string;
      desc: string;
    };
  };
  form: {
    required: string;
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    nav: {
      searchPlaceholder: "Search products",
      cart: "Cart",
      favorites: "Favorites",
      account: "Account",
    },
    banner: {
      freeShipping: "Free shipping from €50",
    },
    ageGate: {
      title: "Are you over 18?",
      description:
        "By entering Palmanhac Shop you confirm you are of legal drinking age in your country.",
      confirm: "Yes",
      deny: "No",
      deniedTitle: "Access Restricted",
      deniedDescription:
        "We are sorry, but you must be of legal drinking age to explore Palmanhac Shop.",
    },
    home: {
      heroHeading: "Palmanhac. Product of Portugal.",
      heroSubheading:
        "Discover artisanal Portuguese liqueurs, aguardente, and celebrated spirits crafted with heritage and heart.",
      shopNow: "Shop Collections",
      exploreCollections: "Explore Our Collections",
      featuredTitle: "Featured Spirits",
      featuredDescription:
        "Handpicked selections to introduce you to the depth and character of Palmanhac.",
      categories: {
        licor: "Licor",
        aguardente: "Aguardente",
        bebidaEspirituosa: "Bebida Espiritosa",
      },
    },
    about: {
      heading: "About Palmanhac",
      missionTitle: "Our Mission",
      missionDescription:
        "We celebrate the craft of Portuguese distillation, highlighting small producers and their signature spirits.",
      craftsmanshipTitle: "Craftsmanship",
      craftsmanshipDescription:
        "From maceration to maturation, each bottle is perfected through meticulous processes and sustainable practices.",
      heritageTitle: "Heritage",
      heritageDescription:
        "Inspired by the landscapes of Portugal, Palmanhac blends tradition with modern refinement.",
    },
    contact: {
      heading: "Contact Us",
      subheading:
        "Share your inquiries with us and our team will respond within one business day.",
      form: {
        name: "Name",
        email: "Email",
        message: "Message",
        submit: "Send Message",
        success: "Thank you — we will be in touch shortly.",
      },
    },
    account: {
      heading: "Personal Account",
      subheading:
        "Sign in to manage your orders, saved items, and preferences. Account features arrive soon.",
      email: "Email",
      password: "Password",
      login: "Sign In",
      createAccount: "Create Account",
    },
    cart: {
      heading: "Your Cart",
      empty: "Your cart is empty. Discover our spirits to begin your collection.",
      subtotal: "Items subtotal",
      discount: "Bulk discount (10+ bottles)",
      delivery: "Delivery",
      total: "Order total",
      vatIncluded: "VAT included",
      checkout: "Proceed to Checkout",
      continueShopping: "Continue Shopping",
      addAllFavorites: "Add favorites to cart",
      remove: "Remove",
      cleared: "Cart cleared",
      clearButton: "Clear cart",
    },
    favorites: {
      heading: "Favorites",
      empty: "You have not saved any items yet.",
      moveToCart: "Add all to cart",
      clear: "Clear favorites",
    },
    footer: {
      newsletterTitle: "Join the Palmanhac circle",
      newsletterDescription:
        "Receive release news, tasting notes, and invitations to private events.",
      emailPlaceholder: "Email address",
      submit: "Subscribe",
      legalLinks: {
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        cookies: "Cookie Policy",
      },
      rights: "© Palmanhac Shop. All rights reserved.",
    },
    product: {
      quantity: "Quantity",
      addToCart: "Add to Cart",
      addToFavorites: "Add to Favorites",
      removeFromFavorites: "Removed from Favorites",
      description: "Description",
      relatedItems: "Related Items",
      categoryLabel: "Category",
    },
    catalog: {
      heading: "Refine selection",
      searchLabel: "Search",
      searchPlaceholder: "Search within this collection",
      clearSearch: "Clear search",
      sortLabel: "Sort by price",
      priceSort: {
        asc: "Price: Low to High",
        desc: "Price: High to Low",
      },
    },
    form: {
      required: "This field is required.",
    },
  },
  pt: {
    nav: {
      searchPlaceholder: "Pesquisar produtos",
      cart: "Carrinho",
      favorites: "Favoritos",
      account: "Conta",
    },
    banner: {
      freeShipping: "Portes grátis a partir de 50 €",
    },
    ageGate: {
      title: "Tem mais de 18 anos?",
      description:
        "Ao aceder à Palmanhac Shop confirma que tem idade legal para consumir bebidas alcoólicas.",
      confirm: "Sim",
      deny: "Não",
      deniedTitle: "Acesso Restrito",
      deniedDescription:
        "Lamentamos, mas tem de ter idade legal para explorar a Palmanhac Shop.",
    },
    home: {
      heroHeading: "Palmanhac Produto de Portugal.",
      heroSubheading:
        "Descubra licores artesanais portugueses, aguardente e espirituosas celebradas, elaboradas com tradição e alma.",
      shopNow: "Ver Coleções",
      exploreCollections: "Explore as Nossas Coleções",
      featuredTitle: "Destaques",
      featuredDescription:
        "Seleções escolhidas para dar a conhecer a profundidade e o caráter da Palmanhac.",
      categories: {
        licor: "Licor",
        aguardente: "Aguardente",
        bebidaEspirituosa: "Bebida Espirituosa",
      },
    },
    about: {
      heading: "Sobre a Palmanhac",
      missionTitle: "A Nossa Missão",
      missionDescription:
        "Celebramos a arte da destilação portuguesa, destacando pequenos produtores e os seus espirituosos de assinatura.",
      craftsmanshipTitle: "Ofício",
      craftsmanshipDescription:
        "Da maceração à maturação, cada garrafa é aperfeiçoada com processos meticulosos e práticas sustentáveis.",
      heritageTitle: "Herança",
      heritageDescription:
        "Inspirada nas paisagens de Portugal, a Palmanhac combina tradição com um requinte contemporâneo.",
    },
    contact: {
      heading: "Contacte-nos",
      subheading:
        "Partilhe connosco as suas questões e responderemos dentro de um dia útil.",
      form: {
        name: "Nome",
        email: "Email",
        message: "Mensagem",
        submit: "Enviar Mensagem",
        success: "Obrigado — entraremos em contacto em breve.",
      },
    },
    account: {
      heading: "Conta Pessoal",
      subheading:
        "Inicie sessão para gerir encomendas, itens guardados e preferências. Em breve haverá mais funcionalidades.",
      email: "Email",
      password: "Palavra-passe",
      login: "Entrar",
      createAccount: "Criar Conta",
    },
    cart: {
      heading: "O Seu Carrinho",
      empty:
        "O carrinho está vazio. Descubra os nossos espirituosos para começar a coleção.",
      subtotal: "Subtotal de artigos",
      discount: "Desconto de quantidade (10+ garrafas)",
      delivery: "Entrega",
      total: "Total da encomenda",
      vatIncluded: "Inclui IVA",
      checkout: "Prosseguir para Checkout",
      continueShopping: "Continuar a Comprar",
      addAllFavorites: "Adicionar favoritos ao carrinho",
      remove: "Remover",
      cleared: "Carrinho limpo",
      clearButton: "Limpar carrinho",
    },
    favorites: {
      heading: "Favoritos",
      empty: "Ainda não guardou itens.",
      moveToCart: "Adicionar tudo ao carrinho",
      clear: "Limpar favoritos",
    },
    footer: {
      newsletterTitle: "Entre no círculo Palmanhac",
      newsletterDescription:
        "Receba novidades, notas de prova e convites para eventos privados.",
      emailPlaceholder: "Endereço de email",
      submit: "Subscrever",
      legalLinks: {
        privacy: "Política de Privacidade",
        terms: "Termos de Serviço",
        cookies: "Política de Cookies",
      },
      rights: "© Palmanhac Shop. Todos os direitos reservados.",
    },
    product: {
      quantity: "Quantidade",
      addToCart: "Adicionar ao Carrinho",
      addToFavorites: "Adicionar aos Favoritos",
      removeFromFavorites: "Removido dos Favoritos",
      description: "Descrição",
      relatedItems: "Itens Relacionados",
      categoryLabel: "Categoria",
    },
    catalog: {
      heading: "Refinar seleção",
      searchLabel: "Pesquisar",
      searchPlaceholder: "Pesquisar nesta coleção",
      clearSearch: "Limpar pesquisa",
      sortLabel: "Ordenar por preço",
      priceSort: {
        asc: "Preço: menor para maior",
        desc: "Preço: maior para menor",
      },
    },
    form: {
      required: "Este campo é obrigatório.",
    },
  },
};

export const getDictionary = (locale: Locale): Dictionary => {
  if (locale in dictionaries) {
    return dictionaries[locale];
  }

  return dictionaries.en;
};
