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
    heroEyebrow: string;
    heroHeading: string;
    heroSubheading: string;
    shopNow: string;
    exploreCollections: string;
    allProductsEyebrow: string;
    allProductsTitle: string;
    allProductsDescription: string;
    featuredTitle: string;
    featuredDescription: string;
    featuredPrevious: string;
    featuredNext: string;
    categories: {
      licor: string;
      aguardente: string;
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
    logistics: string;
    addressHeading: string;
    addressLines: string[];
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
    name: string;
    password: string;
    confirmPassword: string;
    login: string;
    createAccount: string;
    logout: string;
    googleSignIn: string;
    noAccountCta: string;
    hasAccountCta: string;
    passwordHint: string;
    alerts: {
      loginFailed: string;
      registrationSuccess: string;
      registrationFailed: string;
      passwordUpdated: string;
      passwordMismatch: string;
    };
    dashboard: {
      greeting: string;
      manageAccount: string;
      viewOrders: string;
      viewFavorites: string;
      changePassword: string;
      changePasswordDescription: string;
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
      submit: string;
      success: string;
    };
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
  checkout: {
    heading: string;
    subheading: string;
    contactInformation: string;
    contactEmailLabel: string;
    contactPhoneLabel: string;
    shippingAddress: string;
    shippingNameLabel: string;
    shippingAddress1Label: string;
    shippingAddress2Label: string;
    shippingCityLabel: string;
    shippingPostalCodeLabel: string;
    shippingCountryLabel: string;
    billingAddress: string;
    billingSameAsShipping: string;
    notesLabel: string;
    notesPlaceholder: string;
    paymentDetails: string;
    paymentMethodDescription: string;
    paymentMethodLabel: string;
    paymentServiceUnavailable: string;
    startPaymentCta: string;
    processingPayment: string;
    mbwayPhoneLabel: string;
    mbwayPhonePlaceholder: string;
    mbwayPhoneRequired: string;
    methods: Record<"multibanco" | "mbway" | "card", string>;
    methodDescriptions: Record<"multibanco" | "mbway" | "card", string>;
    resultHeading: string;
    resultInstructions: {
      multibanco: string;
      mbway: string;
      card: string;
    };
    resultFields: {
      entity: string;
      reference: string;
      amount: string;
      expiresAt: string;
    };
    multibancoReminder: string;
    mbwayPrompt: string;
    mbwayAwaiting: string;
    mbwayStatusLink: string;
    statusLabel: string;
    statusCheckInProgress: string;
    statusFailed: string;
    statusPaid: string;
    statusPollingTimedOut: string;
    cardRedirectMessage: string;
    viewOrdersCta: string;
    summary: string;
    summaryItems: string;
    summaryEmpty: string;
    subtotalLabel: string;
    discountLabel: string;
    deliveryLabel: string;
    total: string;
    vatIncluded: string;
  };
  favorites: {
    heading: string;
    empty: string;
    moveToCart: string;
    clear: string;
    removed: string;
    synced: string;
    error: string;
  };
  orders: {
    heading: string;
    empty: string;
    placedOn: string;
    total: string;
    items: string;
    itemCount: string;
    noItems: string;
    status: Record<
      "PENDING" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED",
      string
    >;
    paymentStatus: Record<"UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED", string>;
    viewDetails: string;
  };
  twoFactor: {
    setupTitle: string;
    setupDescription: string;
    generateSecret: string;
    qrLabel: string;
    manualCodeLabel: string;
    verificationLabel: string;
    verifyButton: string;
    recoveryCodesTitle: string;
    recoveryCodesDescription: string;
    challengeTitle: string;
    challengeDescription: string;
    recoveryCodeLabel: string;
    submitButton: string;
    success: string;
    error: string;
  };
  footer: {
    newsletterTitle: string;
    newsletterDescription: string;
    emailPlaceholder: string;
    submit: string;
    logisticsBlurb: string;
    addressHeading: string;
    addressLines: string[];
    complaintsBook: string;
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
    details: {
      region: string;
      base: string;
      type: string;
      alcoholContent: string;
      bottleSize: string;
      servingTemperature: string;
      awards: string;
    };
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
      title: "Are you of legal drinking age?",
      description: "Palmanhac promotes the responsible enjoyment of our spirits.",
      confirm: "Yes",
      deny: "No",
      deniedTitle: "Access Restricted",
      deniedDescription: "We can only share Palmanhac with adults of legal drinking age.",
    },
    home: {
      heroEyebrow: "Palmanhac Shop",
      heroHeading: "Palmanhac. Product of Portugal.",
      heroSubheading:
        "Discover artisanal Portuguese liqueurs, aguardente, and celebrated spirits crafted with heritage and heart.",
      shopNow: "Shop Collections",
      exploreCollections: "Explore Our Collections",
      allProductsEyebrow: "Our Selection",
      allProductsTitle: "All Palmanhac Spirits",
      allProductsDescription:
        "Browse every bottle from Palmanhac, spanning liqueurs and handcrafted aguardente.",
      featuredTitle: "Featured Spirits",
      featuredDescription:
        "Handpicked selections to introduce you to the depth and character of Palmanhac.",
      featuredPrevious: "Scroll featured spirits backward",
      featuredNext: "Scroll featured spirits forward",
      categories: {
        licor: "Licor",
        aguardente: "Aguardente",
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
      logistics:
        "Deliveries within 24–48h in Mainland Portugal. Free shipping for orders over €50.",
      addressHeading: "Client Services",
      addressLines: [
        "KARMUXILON LDA",
        "Palmanhac",
        "Destilaria-Adega Rua de Mercúrio lote 38",
        "Vale do Alecrim, Palmela",
        "Post Code 2950-019",
        "Tel: T.964 690 254",
        "Site: www.palmanhac.pt",
        "Mail: info@palmanhac.pt",
        "Working hours: 09.00 - 18.00",
      ],
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
        "Sign in to manage orders, saved items, and security preferences for your Palmanhac profile.",
      email: "Email",
      name: "Full Name",
      password: "Password",
      confirmPassword: "Confirm Password",
      login: "Sign In",
      createAccount: "Create Account",
      logout: "Sign Out",
      googleSignIn: "Continue with Google",
      noAccountCta: "Don't have an account?",
      hasAccountCta: "Already have an account?",
      passwordHint:
        "Passwords must be at least 12 characters and include uppercase, lowercase, numbers, and symbols.",
      alerts: {
        loginFailed: "Unable to sign in with those credentials.",
        registrationSuccess: "Account created successfully. You can sign in now.",
        registrationFailed:
          "Registration failed. Please review the details and try again.",
        passwordUpdated: "Password updated successfully.",
        passwordMismatch: "Passwords must match before continuing.",
      },
      dashboard: {
        greeting: "Hello",
        manageAccount: "Manage your Palmanhac account",
        viewOrders: "View Orders",
        viewFavorites: "View Favorites",
        changePassword: "Update Password",
        changePasswordDescription:
          "Enter your current password to set a new, secure password.",
        currentPassword: "Current Password",
        newPassword: "New Password",
        confirmPassword: "Confirm New Password",
        submit: "Save Password",
        success: "Password updated successfully.",
      },
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
    checkout: {
      heading: "Checkout",
      subheading: "Confirm your details and complete your Palmanhac order.",
      contactInformation: "Contact information",
      contactEmailLabel: "Email address",
      contactPhoneLabel: "Phone (optional)",
      shippingAddress: "Shipping address",
      shippingNameLabel: "Full name",
      shippingAddress1Label: "Address line 1",
      shippingAddress2Label: "Address line 2 (optional)",
      shippingCityLabel: "City",
      shippingPostalCodeLabel: "Postal code",
      shippingCountryLabel: "Country",
      billingAddress: "Billing address",
      billingSameAsShipping: "Use shipping address for billing",
      notesLabel: "Order notes",
      notesPlaceholder: "Share delivery preferences or gift messages.",
      paymentDetails: "Payment",
      paymentMethodDescription:
        "Pay securely with EuPago (Multibanco, MB WAY, or Cards).",
      paymentMethodLabel: "Choose a payment method",
      paymentServiceUnavailable:
        "Payments are unavailable right now. Please try again shortly.",
      startPaymentCta: "Place order",
      processingPayment: "Processing payment...",
      mbwayPhoneLabel: "MB WAY phone number",
      mbwayPhonePlaceholder: "e.g. 912345678",
      mbwayPhoneRequired: "Please provide a phone number for MB WAY.",
      methods: {
        multibanco: "Multibanco",
        mbway: "MB WAY",
        card: "Card",
      },
      methodDescriptions: {
        multibanco:
          "Pay later at an ATM or online banking using the generated reference.",
        mbway: "Approve the request in your MB WAY app to complete the order instantly.",
        card: "Secure card payment via EuPago’s hosted checkout.",
      },
      resultHeading: "Payment instructions",
      resultInstructions: {
        multibanco: "Use these references to complete the payment via Multibanco.",
        mbway: "Approve the payment in your MB WAY app to confirm your order.",
        card: "You will be redirected to EuPago’s secure card checkout.",
      },
      resultFields: {
        entity: "Entity",
        reference: "Reference",
        amount: "Amount",
        expiresAt: "Expires",
      },
      multibancoReminder:
        "After you complete the payment, your order will update automatically. You can monitor the status from the Orders page.",
      mbwayPrompt:
        "Approve the payment in your MB WAY app. We’ll refresh the status automatically once it’s confirmed.",
      mbwayAwaiting: "Awaiting approval",
      mbwayStatusLink: "View live status",
      statusLabel: "Status",
      statusCheckInProgress: "Checking payment status…",
      statusFailed:
        "The payment was not approved. You can try again or choose another method.",
      statusPaid: "Payment confirmed. Redirecting to your orders…",
      statusPollingTimedOut:
        "We could not confirm the payment automatically. Please review the Orders page for the latest status.",
      cardRedirectMessage:
        "You’ll be redirected to EuPago’s secure card page to finish the payment.",
      viewOrdersCta: "Go to Orders",
      summary: "Order summary",
      summaryItems: "{count} items",
      summaryEmpty: "Your cart is empty. Add bottles to continue.",
      subtotalLabel: "Subtotal",
      discountLabel: "Discount",
      deliveryLabel: "Delivery",
      total: "Total",
      vatIncluded: "VAT included",
    },
    favorites: {
      heading: "Favorites",
      empty: "You have not saved any items yet.",
      moveToCart: "Add all to cart",
      clear: "Clear favorites",
      removed: "Removed from favorites",
      synced: "Favorites synced with your account.",
      error: "Unable to update favorites. Please try again.",
    },
    orders: {
      heading: "Orders",
      empty: "You have not placed any orders yet.",
      placedOn: "Placed on",
      total: "Total",
      items: "Items",
      itemCount: "{count} items",
      noItems: "No items in this order.",
      status: {
        PENDING: "Pending",
        PROCESSING: "Processing",
        SHIPPED: "Shipped",
        COMPLETED: "Completed",
        CANCELLED: "Cancelled",
      },
      paymentStatus: {
        UNPAID: "Unpaid",
        PENDING: "Payment pending",
        PAID: "Paid",
        FAILED: "Payment failed",
        REFUNDED: "Refunded",
      },
      viewDetails: "View details",
    },
    twoFactor: {
      setupTitle: "Secure Admin Access",
      setupDescription:
        "Protect the Palmanhac admin area with Google Authenticator compatible two-factor authentication.",
      generateSecret: "Generate Setup QR Code",
      qrLabel: "Scan this QR code with Google Authenticator",
      manualCodeLabel: "Or enter this code manually",
      verificationLabel: "Enter the 6-digit code",
      verifyButton: "Activate 2FA",
      recoveryCodesTitle: "Recovery Codes",
      recoveryCodesDescription:
        "Store these codes in a secure place. Each code can only be used once if you lose your device.",
      challengeTitle: "Two-Factor Challenge",
      challengeDescription:
        "Enter your current 6-digit verification code or apply a recovery code to continue.",
      recoveryCodeLabel: "Recovery code",
      submitButton: "Verify Access",
      success: "Two-factor authentication verified successfully.",
      error: "Code verification failed. Please try again.",
    },
    footer: {
      newsletterTitle: "Join the Palmanhac circle",
      newsletterDescription:
        "Receive release news, tasting notes, and invitations to private events.",
      emailPlaceholder: "Email address",
      submit: "Subscribe",
      logisticsBlurb:
        "Deliveries within 24–48h in Mainland Portugal. Free shipping for orders over €50.",
      addressHeading: "Client Services",
      addressLines: [
        "KARMUXILON LDA",
        "Palmanhac",
        "Destilaria-Adega Rua de Mercúrio lote 38",
        "Vale do Alecrim, Palmela",
        "Post Code 2950-019",
        "Tel: T.964 690 254",
        "Site: www.palmanhac.pt",
        "Mail: info@palmanhac.pt",
        "Working hours: 09.00 - 18.00",
      ],
      complaintsBook: "Livro de Reclamações",
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
      details: {
        region: "Region",
        base: "Base",
        type: "Type / Color",
        alcoholContent: "Alcohol Content",
        bottleSize: "Bottle Size",
        servingTemperature: "Serving Temperature",
        awards: "Awards",
      },
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
      title: "Tem idade legal para o consumo de bebidas alcoólicas?",
      description: "A Palmanhac promove o consumo responsável das nossas bebidas.",
      confirm: "Sim",
      deny: "Não",
      deniedTitle: "Acesso Restrito",
      deniedDescription: "Só podemos partilhar a Palmanhac com maiores de idade.",
    },
    home: {
      heroEyebrow: "Palmanhac Shop",
      heroHeading: "Palmanhac Produto de Portugal.",
      heroSubheading:
        "Descubra licores artesanais portugueses, aguardente e espirituosas celebradas, elaboradas com tradição e alma.",
      shopNow: "Ver Coleções",
      exploreCollections: "Explore as Nossas Coleções",
      allProductsEyebrow: "A Nossa Seleção",
      allProductsTitle: "Todos os Espirituosos Palmanhac",
      allProductsDescription:
        "Explore cada garrafa Palmanhac, incluindo licores e aguardentes artesanais.",
      featuredTitle: "Destaques",
      featuredDescription:
        "Seleções escolhidas para dar a conhecer a profundidade e o caráter da Palmanhac.",
      featuredPrevious: "Recuar destaques de espirituosas",
      featuredNext: "Avançar destaques de espirituosas",
      categories: {
        licor: "Licor",
        aguardente: "Aguardente",
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
      logistics:
        "Entregas em 24–48h em Portugal Continental. Portes gratuitos para encomendas superiores a 50€.",
      addressHeading: "Atendimento ao Cliente",
      addressLines: [
        "KARMUXILON LDA",
        "Palmanhac",
        "Destilaria-Adega Rua de Mercúrio lote 38",
        "Vale do Alecrim, Palmela",
        "Código Postal 2950-019",
        "Tel.: T.964 690 254",
        "Site: www.palmanhac.pt",
        "Email: info@palmanhac.pt",
        "Horário: 09h00 - 18h00",
      ],
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
        "Inicie sessão para gerir encomendas, favoritos e a segurança do seu perfil Palmanhac.",
      email: "Email",
      name: "Nome completo",
      password: "Palavra-passe",
      confirmPassword: "Confirmar palavra-passe",
      login: "Entrar",
      createAccount: "Criar Conta",
      logout: "Terminar sessão",
      googleSignIn: "Continuar com Google",
      noAccountCta: "Ainda não tem conta?",
      hasAccountCta: "Já tem conta?",
      passwordHint:
        "A palavra-passe deve ter pelo menos 12 caracteres e incluir maiúsculas, minúsculas, números e símbolos.",
      alerts: {
        loginFailed: "Não foi possível iniciar sessão com essas credenciais.",
        registrationSuccess: "Conta criada com sucesso. Já pode iniciar sessão.",
        registrationFailed:
          "Não foi possível concluir o registo. Verifique os dados e tente novamente.",
        passwordUpdated: "Palavra-passe atualizada com sucesso.",
        passwordMismatch: "As palavras-passe devem ser iguais antes de continuar.",
      },
      dashboard: {
        greeting: "Olá",
        manageAccount: "Gerir a sua conta Palmanhac",
        viewOrders: "Ver encomendas",
        viewFavorites: "Ver favoritos",
        changePassword: "Atualizar palavra-passe",
        changePasswordDescription:
          "Introduza a palavra-passe atual para definir uma nova palavra-passe segura.",
        currentPassword: "Palavra-passe atual",
        newPassword: "Nova palavra-passe",
        confirmPassword: "Confirmar nova palavra-passe",
        submit: "Guardar palavra-passe",
        success: "Palavra-passe atualizada com sucesso.",
      },
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
    checkout: {
      heading: "Checkout",
      subheading: "Confirme os seus dados e finalize a encomenda Palmanhac.",
      contactInformation: "Informações de contacto",
      contactEmailLabel: "Email",
      contactPhoneLabel: "Telefone (opcional)",
      shippingAddress: "Morada de envio",
      shippingNameLabel: "Nome completo",
      shippingAddress1Label: "Morada linha 1",
      shippingAddress2Label: "Morada linha 2 (opcional)",
      shippingCityLabel: "Cidade",
      shippingPostalCodeLabel: "Código postal",
      shippingCountryLabel: "País",
      billingAddress: "Morada de faturação",
      billingSameAsShipping: "Usar morada de envio para faturação",
      notesLabel: "Notas da encomenda",
      notesPlaceholder: "Partilhe preferências de entrega ou mensagens de oferta.",
      paymentDetails: "Pagamento",
      paymentMethodDescription:
        "Pague com segurança através da EuPago (Multibanco, MB WAY ou Cartões).",
      paymentMethodLabel: "Escolha o método de pagamento",
      paymentServiceUnavailable:
        "Os pagamentos não estão disponíveis neste momento. Tente novamente em breve.",
      startPaymentCta: "Finalizar encomenda",
      processingPayment: "A processar pagamento...",
      mbwayPhoneLabel: "Telemóvel MB WAY",
      mbwayPhonePlaceholder: "ex.: 912345678",
      mbwayPhoneRequired: "Indique um número de telefone para MB WAY.",
      methods: {
        multibanco: "Multibanco",
        mbway: "MB WAY",
        card: "Cartão",
      },
      methodDescriptions: {
        multibanco:
          "Pague mais tarde no Multibanco ou homebanking com a referência gerada.",
        mbway: "Aprove o pedido na app MB WAY para confirmar de imediato.",
        card: "Pagamento seguro com cartão através da EuPago.",
      },
      resultHeading: "Instruções de pagamento",
      resultInstructions: {
        multibanco: "Use estes dados para concluir o pagamento via Multibanco.",
        mbway: "Aprove o pagamento na app MB WAY para confirmar a encomenda.",
        card: "Será redirecionado para o checkout seguro da EuPago.",
      },
      resultFields: {
        entity: "Entidade",
        reference: "Referência",
        amount: "Montante",
        expiresAt: "Expira",
      },
      multibancoReminder:
        "Depois de efetuar o pagamento, a encomenda atualiza automaticamente. Acompanhe o estado na página de Encomendas.",
      mbwayPrompt:
        "Aprove o pagamento na app MB WAY. Atualizamos o estado assim que for confirmado.",
      mbwayAwaiting: "A aguardar aprovação",
      mbwayStatusLink: "Ver estado em tempo real",
      statusLabel: "Estado",
      statusCheckInProgress: "A verificar o estado do pagamento...",
      statusFailed:
        "O pagamento não foi aprovado. Tente novamente ou escolha outro método.",
      statusPaid: "Pagamento confirmado. A redirecionar para as suas encomendas...",
      statusPollingTimedOut:
        "Não foi possível confirmar automaticamente. Consulte a página de Encomendas para o estado atual.",
      cardRedirectMessage:
        "Será redirecionado para a página segura da EuPago para concluir o pagamento.",
      viewOrdersCta: "Ir para Encomendas",
      summary: "Resumo da encomenda",
      summaryItems: "{count} artigos",
      summaryEmpty: "O carrinho está vazio. Adicione garrafas para continuar.",
      subtotalLabel: "Subtotal",
      discountLabel: "Desconto",
      deliveryLabel: "Entrega",
      total: "Total",
      vatIncluded: "Inclui IVA",
    },
    favorites: {
      heading: "Favoritos",
      empty: "Ainda não guardou itens.",
      moveToCart: "Adicionar tudo ao carrinho",
      clear: "Limpar favoritos",
      removed: "Removido dos favoritos",
      synced: "Favoritos sincronizados com a sua conta.",
      error: "Não foi possível atualizar os favoritos. Tente novamente.",
    },
    orders: {
      heading: "Encomendas",
      empty: "Ainda não realizou nenhuma encomenda.",
      placedOn: "Data da encomenda",
      total: "Total",
      items: "Artigos",
      itemCount: "{count} artigos",
      noItems: "Sem artigos nesta encomenda.",
      status: {
        PENDING: "Pendente",
        PROCESSING: "Em processamento",
        SHIPPED: "Enviada",
        COMPLETED: "Concluída",
        CANCELLED: "Cancelada",
      },
      paymentStatus: {
        UNPAID: "Por pagar",
        PENDING: "Pagamento pendente",
        PAID: "Pago",
        FAILED: "Pagamento falhou",
        REFUNDED: "Reembolsado",
      },
      viewDetails: "Ver detalhes",
    },
    twoFactor: {
      setupTitle: "Proteger acesso de administrador",
      setupDescription:
        "Proteja a área de administração da Palmanhac com autenticação de dois fatores compatível com o Google Authenticator.",
      generateSecret: "Gerar código QR de configuração",
      qrLabel: "Digitalize este QR code com o Google Authenticator",
      manualCodeLabel: "Ou introduza este código manualmente",
      verificationLabel: "Introduza o código de 6 dígitos",
      verifyButton: "Ativar 2FA",
      recoveryCodesTitle: "Códigos de recuperação",
      recoveryCodesDescription:
        "Guarde estes códigos num local seguro. Cada código só pode ser usado uma vez caso perca o dispositivo.",
      challengeTitle: "Desafio de dois fatores",
      challengeDescription:
        "Introduza o código de verificação de 6 dígitos ou utilize um código de recuperação para continuar.",
      recoveryCodeLabel: "Código de recuperação",
      submitButton: "Verificar acesso",
      success: "Autenticação de dois fatores verificada com sucesso.",
      error: "Falha na verificação do código. Tente novamente.",
    },
    footer: {
      newsletterTitle: "Entre no círculo Palmanhac",
      newsletterDescription:
        "Receba novidades, notas de prova e convites para eventos privados.",
      emailPlaceholder: "Endereço de email",
      submit: "Subscrever",
      logisticsBlurb:
        "Entregas em 24–48h em Portugal Continental. Portes gratuitos para encomendas superiores a 50€.",
      addressHeading: "Atendimento ao Cliente",
      addressLines: [
        "KARMUXILON LDA",
        "Palmanhac",
        "Destilaria-Adega Rua de Mercúrio lote 38",
        "Vale do Alecrim, Palmela",
        "Código Postal 2950-019",
        "Tel.: T.964 690 254",
        "Site: www.palmanhac.pt",
        "Email: info@palmanhac.pt",
        "Horário: 09h00 - 18h00",
      ],
      complaintsBook: "Livro de Reclamações",
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
      details: {
        region: "Região",
        base: "Base",
        type: "Tipo / Cor",
        alcoholContent: "Teor Alcoólico",
        bottleSize: "Formato",
        servingTemperature: "Temperatura de Serviço",
        awards: "Prémios",
      },
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
