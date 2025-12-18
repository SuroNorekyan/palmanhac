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
    shippingIntro: string;
    shippingContact: string;
    dismissLabel: string;
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
      bebidaEspirituosa: string;
    };
  };
  about: {
    hero: {
      eyebrow: string;
      heading: string;
      description: string;
      contact: Array<{
        label: string;
        value: string;
        href?: string;
      }>;
    };
    pillars: Array<{
      title: string;
      description: string;
    }>;
    faq: {
      title: string;
      subtitle: string;
      categories: Array<{
        id: string;
        title: string;
        items: Array<{
          question: string;
          answer: string[];
        }>;
      }>;
    };
    shippingReturns: {
      title: string;
      subtitle: string;
      shipping: {
        title: string;
        notes: string[];
        costsTitle: string;
        costs: string[];
        extraNotes: string[];
      };
      returns: {
        title: string;
        notes: string[];
        exceptionsTitle: string;
        exceptions: string[];
        supportTitle: string;
        supportDetails: string[];
      };
    };
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
    shippingNoticeTitle: string;
    multibancoNoticeTitle: string;
    multibancoNotice: string;
    confirmationNoticeTitle: string;
    confirmationNotice: string;
    contactInformation: string;
    contactEmailLabel: string;
    contactPhoneLabel: string;
    taxIdLabel: string;
    taxIdHelper: string;
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
    pendingHeading: string;
    pendingSubheading: string;
    pendingDescription: string;
    pendingStatusLabel: string;
    pendingStatusAwaiting: string;
    pendingStatusPaid: string;
    pendingStatusFailed: string;
    pendingHint: string;
    pendingRefresh: string;
    pendingOrdersCta: string;
    pendingSupportMessage: string;
    pendingMissingOrder: string;
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
    cardDetailsLabel: string;
    cardUnavailable: string;
    cardInitializing: string;
    cardElementUnavailable: string;
    cardDetailsIncomplete: string;
    cardErrorFallback: string;
    cardProcessingMessage: string;
    cardStatusProcessing: string;
    cardStatusSuccess: string;
    cardStatusPending: string;
    cardSuccessHeading: string;
    cardSuccessMessage: string;
    cardPendingHeading: string;
    cardPendingProcessing: string;
    cardPendingGeneric: string;
    cardFinalizeWarning: string;
    thankYouHeading: string;
    thankYouSubheading: string;
    thankYouOrdersCta: string;
    thankYouTrackCta: string;
    thankYouOrderLabel: string;
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
    statusDetails: {
      mbwayPending: string;
      multibancoPending: string;
      cardPending: string;
      paid: string;
    };
    pendingSupportMessage: string;
    paymentMethodLabel: string;
    paymentMethodUnknown: string;
    viewDetails: string;
    searchLabel: string;
    searchPlaceholder: string;
    searchEmpty: string;
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
    discount: {
      badge: string;
      percentLabel: string;
      savingsLabel: string;
    };
    reviews: {
      heading: string;
      averageLabel: string;
      writeReview: string;
      ratingLabel: string;
      commentLabel: string;
      guestNameLabel: string;
      guestEmailLabel: string;
      submit: string;
      success: string;
      error: string;
      empty: string;
      countLabel: string;
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
      freeShipping: "Free shipping from €60",
      shippingIntro: "Currently, we ship to mainland Portugal and Spain.",
      shippingContact:
        "For other international orders, please contact us at info@palmanhac-shop.pt to check the possibility of shipping.",
      dismissLabel: "Close announcement",
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
        bebidaEspirituosa: "Bebida Espirituosa",
      },
    },
    about: {
      hero: {
        eyebrow: "About Palmanhac",
        heading: "Tradition, craft, and a modern sip of Portugal",
        description:
          "Palmanhac is the online home of KARMUXILON LDA, a family-run distillery launched in 2020. We pair heritage recipes with innovation to bottle liqueurs and brandies with soul.",
        contact: [
          {
            label: "Email",
            value: "info@palmanhac-shop.pt",
            href: "mailto:info@palmanhac-shop.pt",
          },
          {
            label: "Phone / WhatsApp",
            value: "(+351) 964 690 254",
            href: "tel:+351964690254",
          },
          {
            label: "Service hours",
            value: "Monday to Friday, 9:00 AM – 6:00 PM",
          },
        ],
      },
      pillars: [
        {
          title: "Crafted with authenticity",
          description:
            "Each bottle is distilled in small batches, honoring Portuguese terroir and family techniques perfected over generations.",
        },
        {
          title: "Responsible sourcing",
          description:
            "We nurture close relationships with growers and artisans, selecting ingredients that elevate aroma, texture, and flavor.",
        },
        {
          title: "Celebrating moments",
          description:
            "From gifting to gatherings, Palmanhac spirits are designed to be shared, savored, and remembered.",
        },
      ],
      faq: {
        title: "Frequently Asked Questions",
        subtitle: "Answers to the most common questions from our community.",
        categories: [
          {
            id: "general",
            title: "1. General Information",
            items: [
              {
                question: "What is the Palmanhac online store?",
                answer: [
                  "The Palmanhac online store belongs to KARMUXILON LDA, a family-run company founded in 2020, combining tradition and innovation.",
                  "Customers can purchase handcrafted liqueurs and brandies, internationally recognized for their quality and authenticity.",
                ],
              },
              {
                question: "How can I contact you?",
                answer: [
                  "You can contact us by email at info@palmanhac-shop.pt or by phone/WhatsApp at (+351) 964 690 254.",
                  "We are available Monday to Friday, from 9:00 AM to 6:00 PM.",
                ],
              },
              {
                question: "Do prices include VAT?",
                answer: [
                  "Yes. All prices are shown in euros (€) and include VAT at the legal rate in force, as well as the corresponding excise duty (IEC).",
                ],
              },
            ],
          },
          {
            id: "account",
            title: "2. Account and Personal Data",
            items: [
              {
                question: "Do I need to create an account to make a purchase?",
                answer: [
                  "No, creating an account is not mandatory. However, registration makes future purchases faster and allows you to easily track your orders.",
                ],
              },
              {
                question: "How can I edit or delete my account?",
                answer: [
                  "To delete your account, please send an email to info@palmanhac-shop.pt from your registered address requesting deletion.",
                  'To update your details or password, access your personal area ("My Account") and edit the desired information.',
                ],
              },
              {
                question: "Are my personal data safe?",
                answer: [
                  "Yes. Protecting your data is a top priority for Palmanhac.",
                  "Our database is properly registered with the Comissão Nacional de Proteção de Dados (CNPD), and all communication between your device and our website uses HTTPS and SSL security standards to ensure confidentiality and protection.",
                ],
              },
            ],
          },
          {
            id: "orders",
            title: "3. Orders and Payments",
            items: [
              {
                question: "How can I place an order on the Palmanhac online store?",
                answer: [
                  "It's very simple:",
                  "- Add your desired products to the cart.",
                  "- Review your cart by clicking the icon at the top right.",
                  '- On the "Cart" page, select "Checkout."',
                  "- Fill in your billing and shipping details.",
                  "- Choose your preferred payment method and complete the order.",
                  "After the payment is confirmed, you'll receive an email with order confirmation, and your package will be processed and shipped.",
                ],
              },
              {
                question: "Can I change or cancel my order?",
                answer: [
                  "Yes. To change or cancel an order, please contact us by email (palmanhac@gmail.com) or phone/WhatsApp (964 690 254) on business days between 9:00 AM and 6:00 PM.",
                  "Orders can only be canceled if they have not yet been shipped.",
                ],
              },
              {
                question: "Can I send an order as a gift?",
                answer: [
                  'Yes. At checkout, select the option "Ship to a different address" and provide the recipient\'s details.',
                  "The gift will be sent without an invoice and without price tags.",
                ],
              },
              {
                question: "Which payment methods are accepted?",
                answer: [
                  "We accept credit and debit cards (Visa, MasterCard, Maestro), MB Way, MultiBanco and bank transfer.",
                  "If you choose bank transfer, you will receive the necessary bank details by email.",
                ],
              },
              {
                question: "Are there any additional fees?",
                answer: [
                  "No. The total amount includes the product price and shipping costs (if applicable).",
                ],
              },
              {
                question: "How are refunds handled in case of returns?",
                answer: [
                  "In accordance with Decree-Law No. 24/2014, customers may return products within 14 days of receipt.",
                  "Please contact us by email (palmanhac@gmail.com) to start the return process.",
                  "Products must be returned in perfect condition and in their original packaging.",
                  "Refunds are processed within 30 days after the returned items are received and verified.",
                ],
              },
            ],
          },
          {
            id: "shipping",
            title: "4. Shipping and Delivery",
            items: [
              {
                question: "Which countries do you ship to?",
                answer: [
                  "Currently, we ship to mainland Portugal and Spain.",
                  "For other international orders, please contact us at info@palmanhac-shop.pt to check the possibility of shipping.",
                ],
              },
              {
                question: "Which courier companies do you work with?",
                answer: ["We work with GLS, ensuring safe and reliable deliveries."],
              },
              {
                question: "What is the average delivery time?",
                answer: [
                  "The usual delivery time is 1 to 4 business days after payment confirmation.",
                  "Deliveries to Spain may take slightly longer depending on logistics and customs handling.",
                  "Delays may occur due to courier issues or external factors beyond Palmanhac's control.",
                ],
              },
              {
                question: "What are the shipping costs?",
                answer: [
                  "- €6.00 — 1 to 2 bottles",
                  "- €8.00 — 3 or more bottles",
                  "- Free shipping — for orders over €60.00",
                ],
              },
              {
                question: "When will my order be shipped?",
                answer: [
                  "Orders are shipped after payment confirmation.",
                  "Processing and dispatch generally take 1 business day.",
                ],
              },
              {
                question: "What should I do if the package is damaged or wet?",
                answer: [
                  "If you notice damage at the time of delivery, please refuse the package and contact us immediately.",
                  "Send an email to palmanhac@gmail.com or call 964 690 254 (business days, 9:00 AM – 6:00 PM).",
                ],
              },
              {
                question: "What happens if a bottle breaks during transport?",
                answer: [
                  "If breakage occurs before delivery, a replacement order will be sent at no extra cost.",
                  "If you notice damage after delivery, contact us immediately to arrange a replacement.",
                ],
              },
            ],
          },
          {
            id: "cookies",
            title: "5. Cookie Policy",
            items: [
              {
                question: "What is the Palmanhac cookie policy?",
                answer: [
                  "We use cookies so palmanhac-shop.pt can operate properly, remember essential preferences, and improve navigation.",
                  "By browsing our website you agree to this Cookie Policy and consent to the described use of cookies.",
                ],
              },
              {
                question: "What are cookies?",
                answer: [
                  "Cookies are small files stored on your device that support key website functions, improve navigation, and retain preferences.",
                  "- Session cookies — removed automatically when you close your browser.",
                  "- Persistent cookies — remain stored until they expire or are deleted.",
                  "The cookies we use do not collect personally identifiable information, and you can block or delete them in your browser settings if you wish (doing so may impact website functionality).",
                ],
              },
              {
                question: "Which cookies are used on palmanhac-shop.pt?",
                answer: [
                  "We only rely on the cookies strictly necessary to:",
                  "- ensure the online store runs reliably;",
                  "- store basic user preferences such as language or cart status;",
                  "- enhance navigation and usability so you can complete purchases smoothly.",
                ],
              },
              {
                question: "Do you use third-party cookies or analytics?",
                answer: [
                  "No. We do not use third-party cookies or analytics tools such as Google Analytics to collect personal data.",
                  "If you have questions about cookie usage you can contact us at info@palmanhac-shop.pt.",
                ],
              },
            ],
          },
          {
            id: "privacy",
            title: "6. Privacy Policy",
            items: [
              {
                question: "What does the Palmanhac privacy policy cover?",
                answer: [
                  "Palmanhac respects every visitor's privacy and processes data according to the GDPR (EU Regulation 2016/679).",
                  "You can browse palmanhac-shop.pt without providing personal data, and we only request information when strictly necessary to process orders, contact requests, or newsletter subscriptions.",
                  "This policy applies solely to palmanhac-shop.pt and not to external sites mentioned via links.",
                ],
              },
              {
                question: "What personal data can Palmanhac collect?",
                answer: [
                  "Personal data refers to information that can identify you, such as name, address, phone, email, tax number, birth date, and purchase preferences.",
                  "We do not collect sensitive data, and whenever you provide information voluntarily we treat it as clear and informed consent.",
                  "Depending on the service requested we may collect:",
                  "- name, billing and shipping address, and country;",
                  "- email and phone number;",
                  "- tax ID and date of birth when invoicing requires it;",
                  "- order history and communication records.",
                ],
              },
              {
                question:
                  "Who is responsible for data processing and how can I reach Palmanhac?",
                answer: [
                  "Palmanhac (palmanhac-shop.pt) is the controller responsible for processing your data and for ensuring appropriate security measures.",
                  "For any privacy questions or to exercise your rights, contact info@palmanhac-shop.pt.",
                ],
              },
              {
                question: "Why is personal data processed?",
                answer: [
                  "Data is used exclusively for:",
                  "- processing and shipping orders;",
                  "- issuing invoices and complying with legal obligations;",
                  "- managing customer accounts and providing support;",
                  "- handling complaints and internal statistics;",
                  "- sending updates, newsletters, or campaigns when you grant consent.",
                  "You may opt out of marketing communications at any time.",
                ],
              },
              {
                question: "How long is data stored?",
                answer: [
                  "Data is kept only for as long as necessary to fulfill the purpose for which it was collected or for the period required by law (such as tax obligations).",
                  "You may request deletion of your personal data at any time by emailing info@palmanhac-shop.pt.",
                ],
              },
              {
                question: "Is data shared with third parties?",
                answer: [
                  "Palmanhac only shares data with trusted partners when strictly necessary—for example with shipping companies, payment processors, or IT service providers.",
                  "All partners comply with GDPR requirements, guarantee confidentiality, and data is never sold or misused for commercial purposes.",
                ],
              },
              {
                question: "How are cookies and policy updates managed?",
                answer: [
                  "palmanhac-shop.pt uses cookies only to ensure correct website operation, remember preferences, and generate anonymized statistics.",
                  "You can disable cookies in your browser settings, though some features may be limited.",
                  "Palmanhac may update this Privacy Policy at any time and updates will always be published on this page, so please review it periodically.",
                ],
              },
            ],
          },
        ],
      },
      shippingReturns: {
        title: "Shipping & Returns",
        subtitle: "Practical details for deliveries, returns, and product care.",
        shipping: {
          title: "Shipping",
          notes: [
            "Deliveries are made between 8:00 AM and 6:00 PM on business days only.",
            "Delivery times may vary due to weekends, public holidays, weather conditions, or national holidays.",
            "If the courier attempts delivery and the customer is unavailable, a new delivery attempt will be scheduled.",
            "After the purchase is confirmed, the customer will receive a confirmation email with the details of the items purchased and a tracking number to monitor the delivery status.",
            "The average delivery time within mainland Portugal is 24 to 48 hours after dispatch.",
          ],
          costsTitle: "Delivery costs",
          costs: [
            "€6 for 1 or 2 bottles",
            "€8 for 3 or more bottles",
            "Free delivery for orders over €60",
          ],
          extraNotes: [
            "Palmanhac uses secure, custom packaging designed to ensure the integrity of products during transit.",
          ],
        },
        returns: {
          title: "Returns",
          notes: [
            "In accordance with Decree-Law No. 24/2014, dated February 14, customers have the right to return products within 14 days from the date of receipt.",
            "Bottles must be returned in the same condition in which they were received — unopened, undamaged, and in the original packaging.",
            "Palmanhac reserves the right to refuse products that do not meet these conditions.",
          ],
          exceptionsTitle: "Exceptions",
          exceptions: [
            "Opened products or products with broken security seals",
            "Alcoholic beverages considered perishable",
          ],
          supportTitle: "Need assistance?",
          supportDetails: [
            "If the product is defective, damaged during shipping, or sent incorrectly, Palmanhac will provide a full replacement or refund.",
            "Return requests should be sent to info@palmanhac-shop.pt or +351 964 690 254 (business days, 9:00 AM – 6:00 PM).",
            "Refunds will be processed within a maximum of 30 days after receipt and verification of the returned item.",
            "If the order arrives in unsuitable condition, photograph the item and the back label (where the seal is visible) and email the images so we can arrange collection and replacement.",
          ],
        },
      },
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
        "Passwords must be at least 6 characters and include uppercase, lowercase, and numeric characters.",
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
      shippingNoticeTitle: "Shipping availability",
      multibancoNoticeTitle: "Multibanco temporarily unavailable",
      multibancoNotice:
        "Multibanco payments are currently unavailable while we work on a fix. You can continue using MB WAY and card payments. For any questions, please contact info@palmanhac-shop.pt and we will be happy to assist.",
      confirmationNoticeTitle: "Need help with your confirmation?",
      confirmationNotice:
        "If you've already confirmed the payment but did not receive an email, please reach us at info@palmanhac-shop.pt with your order number and we'll assist right away.",
      contactInformation: "Contact information",
      contactEmailLabel: "Email address",
      contactPhoneLabel: "Phone (optional)",
      taxIdLabel: "Tax ID (NIF / TIN, optional)",
      taxIdHelper: "Included on your confirmation emails when provided.",
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
        "Pay securely via EuPago (Multibanco / MB WAY) or Stripe for cards.",
      paymentMethodLabel: "Choose a payment method",
      paymentServiceUnavailable:
        "Payments are unavailable right now. Please try again shortly.",
      startPaymentCta: "Place order",
      processingPayment: "Processing payment...",
      mbwayPhoneLabel: "MB WAY phone number",
      mbwayPhonePlaceholder: "e.g. +351912345678",
      mbwayPhoneRequired: "Please provide a phone number for MB WAY.",
      pendingHeading: "Order placed — confirm the payment",
      pendingSubheading:
        "We’ll keep checking with EuPago until the payment is confirmed.",
      pendingDescription:
        "Approve the MB WAY request on your phone. If you already approved it, keep this tab open or go to Orders to see the latest status.",
      pendingStatusLabel: "Live status",
      pendingStatusAwaiting: "Awaiting approval in the MB WAY app.",
      pendingStatusPaid: "Payment confirmed. Redirecting to Orders…",
      pendingStatusFailed:
        "The payment was not approved. Choose a different method in the Orders page.",
      pendingHint:
        "Need to double-check? Open the Orders page to review the latest payment status.",
      pendingRefresh: "Refresh status",
      pendingOrdersCta: "Go to Orders",
      pendingSupportMessage:
        "If you have already confirmed the payment in your MB WAY app but the status is not updating here, please contact us at info@palmanhac-shop.pt with your order reference {orderId}. We will be happy to assist you.",
      pendingMissingOrder:
        "We could not find that order reference. Please return to checkout and try again.",
      methods: {
        multibanco: "Multibanco",
        mbway: "MB WAY",
        card: "Card",
      },
      methodDescriptions: {
        multibanco:
          "Pay later at an ATM or online banking using the generated reference.",
        mbway: "Approve the request in your MB WAY app to complete the order instantly.",
        card: "Secure card payment powered by Stripe.",
      },
      resultHeading: "Payment instructions",
      resultInstructions: {
        multibanco: "Use these references to complete the payment via Multibanco.",
        mbway: "Approve the payment in your MB WAY app to confirm your order.",
        card: "Enter your card details below to pay with Stripe.",
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
        "Confirm the payment in the card form above. Stripe may ask for additional verification.",
      cardDetailsLabel: "Card details",
      cardUnavailable:
        "Card payments are temporarily unavailable. Please select another method.",
      cardInitializing: "Stripe is still loading. Please wait a moment.",
      cardElementUnavailable:
        "Unable to initialize the card form. Refresh the page and try again.",
      cardDetailsIncomplete: "Please complete your card details before continuing.",
      cardErrorFallback:
        "Unable to confirm the card payment. Please try again with another card.",
      cardProcessingMessage: "Confirming your card payment securely via Stripe.",
      cardStatusProcessing:
        "Confirming the payment with Stripe. This only takes a moment.",
      cardStatusSuccess: "Payment confirmed. Redirecting to Orders…",
      cardStatusPending: "Payment created — we’re finalising the status.",
      cardSuccessHeading: "Payment confirmed",
      cardSuccessMessage:
        "Thanks! Your payment went through and we’re preparing your order. You can review the latest details from the Orders page.",
      cardPendingHeading: "Payment pending",
      cardPendingProcessing:
        "Stripe is still processing this payment. This usually takes less than a minute.",
      cardPendingGeneric:
        "Stripe marked this payment as “{status}”. We’ll update your Orders page automatically once it changes.",
      cardFinalizeWarning:
        "The payment succeeded but we could not refresh the order automatically. Please review the Orders page for the latest status.",
      thankYouHeading: "Thank you for your purchase!",
      thankYouSubheading:
        "We’re preparing your Palmanhac order. You can track the latest updates whenever you need.",
      thankYouOrdersCta: "Return to my orders",
      thankYouTrackCta: "Track this order",
      thankYouOrderLabel: "Order reference",
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
      paymentMethodLabel: "Payment method",
      paymentMethodUnknown: "Not specified",
      statusDetails: {
        mbwayPending:
          "Awaiting approval in the MB WAY app. Confirm the payment on your phone or wait for EuPago to update the status automatically.",
        multibancoPending:
          "Awaiting Multibanco payment. Use the generated reference and the order will update once the payment is confirmed.",
        cardPending:
          "Awaiting Stripe confirmation. Complete the card payment to update this order.",
        paid: "Payment received. No further action is required.",
      },
      pendingSupportMessage:
        "If you already confirmed this payment but it still shows as pending, please email info@palmanhac-shop.pt with order reference {orderId} and we will assist you right away.",
      viewDetails: "View details",
      searchLabel: "Search orders",
      searchPlaceholder: "Search by order ID, reference, or product",
      searchEmpty: "No orders matched that search.",
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
        "Deliveries within 24–48h in Mainland Portugal. Free shipping for orders over €60.",
      addressHeading: "Client Services",
      addressLines: [
        "KARMUXILON LDA",
        "Palmanhac",
        "Destilaria-Adega Rua de Mercúrio lote 38",
        "Vale do Alecrim, Palmela",
        "Post Code 2950-019",
        "Tel: T.964 690 254",
        "Site: www.palmanhac.pt",
        "Mail: info@palmanhac-shop.pt",
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
      discount: {
        badge: "Discount applied",
        percentLabel: "Discount (%)",
        savingsLabel: "Save {percent}%",
      },
      reviews: {
        heading: "Reviews",
        averageLabel: "Average rating",
        writeReview: "Write a review",
        ratingLabel: "Rating",
        commentLabel: "Comment",
        guestNameLabel: "Name (optional)",
        guestEmailLabel: "Email (optional)",
        submit: "Submit review",
        success: "Thanks! Your review was submitted.",
        error: "Unable to submit review. Please try again.",
        empty: "No reviews yet.",
        countLabel: "{count} reviews",
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
      freeShipping: "Portes grátis a partir de 60 €",
      shippingIntro: "Neste momento enviamos para Portugal continental e Espanha.",
      shippingContact:
        "Para outras encomendas internacionais, contacte-nos através de info@palmanhac-shop.pt para verificarmos a possibilidade de envio.",
      dismissLabel: "Fechar aviso",
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
        bebidaEspirituosa: "Bebida Espirituosa",
      },
    },
    about: {
      hero: {
        eyebrow: "Sobre a Palmanhac",
        heading: "Tradição, ofício e um brinde moderno a Portugal",
        description:
          "A Palmanhac é a loja online da KARMUXILON LDA, uma empresa familiar fundada em 2020. Aliamos receitas tradicionais à inovação para engarrafar licores e aguardentes com alma.",
        contact: [
          {
            label: "Email",
            value: "info@palmanhac-shop.pt",
            href: "mailto:info@palmanhac-shop.pt",
          },
          {
            label: "Telefone / WhatsApp",
            value: "(+351) 964 690 254",
            href: "tel:+351964690254",
          },
          {
            label: "Horário de atendimento",
            value: "Segunda a sexta-feira, das 9h00 às 18h00",
          },
        ],
      },
      pillars: [
        {
          title: "Autenticidade artesanal",
          description:
            "Cada garrafa é destilada em pequenos lotes, respeitando o terroir português e as técnicas de família aperfeiçoadas ao longo de gerações.",
        },
        {
          title: "Seleção responsável",
          description:
            "Mantemos relações próximas com produtores e artesãos, escolhendo ingredientes que elevam aroma, textura e sabor.",
        },
        {
          title: "Momentos para partilhar",
          description:
            "Dos presentes às celebrações, os espirituosos Palmanhac são pensados para serem partilhados, saboreados e recordados.",
        },
      ],
      faq: {
        title: "Perguntas Frequentes",
        subtitle: "Respostas às questões mais comuns da nossa comunidade.",
        categories: [
          {
            id: "general",
            title: "1. Informações Gerais",
            items: [
              {
                question: "O que é a loja online Palmanhac?",
                answer: [
                  "A loja online Palmanhac pertence à KARMUXILON LDA, uma empresa familiar fundada em 2020, que combina tradição e inovação.",
                  "Os clientes podem adquirir licores e aguardentes artesanais, reconhecidos internacionalmente pela sua qualidade e autenticidade.",
                ],
              },
              {
                question: "Como posso entrar em contacto convosco?",
                answer: [
                  "Pode contactar-nos por e-mail através de info@palmanhac-shop.pt ou por telefone/WhatsApp pelo (+351) 964 690 254.",
                  "Estamos disponíveis de segunda a sexta-feira, das 9h00 às 18h00.",
                ],
              },
              {
                question: "Os preços incluem IVA?",
                answer: [
                  "Sim. Todos os preços estão indicados em euros (€) e incluem IVA à taxa legal em vigor, bem como o imposto especial correspondente (IEC).",
                ],
              },
            ],
          },
          {
            id: "account",
            title: "2. Conta e Dados Pessoais",
            items: [
              {
                question: "É necessário criar uma conta para efetuar uma compra?",
                answer: [
                  "Não, criar uma conta não é obrigatório. No entanto, o registo facilita futuras encomendas e permite acompanhar os pedidos de forma mais rápida.",
                ],
              },
              {
                question: "Como posso alterar ou eliminar a minha conta?",
                answer: [
                  "Para eliminar a sua conta, envie um e-mail para info@palmanhac-shop.pt a partir do endereço registado, solicitando a eliminação.",
                  'Para atualizar os seus dados ou palavra-passe, aceda à sua área pessoal ("Minha Conta") e edite as informações desejadas.',
                ],
              },
              {
                question: "Os meus dados pessoais estão seguros?",
                answer: [
                  "Sim. A proteção dos seus dados é uma prioridade para a Palmanhac.",
                  "A nossa base de dados está devidamente registada na Comissão Nacional de Proteção de Dados (CNPD), e toda a comunicação entre o seu dispositivo e o nosso site utiliza HTTPS e SSL, garantindo confidencialidade e segurança.",
                ],
              },
            ],
          },
          {
            id: "orders",
            title: "3. Encomendas e Pagamentos",
            items: [
              {
                question: "Como posso fazer uma encomenda na loja online Palmanhac?",
                answer: [
                  "É muito simples:",
                  "- Adicione os produtos desejados ao carrinho.",
                  "- Verifique o carrinho clicando no ícone no canto superior direito.",
                  '- Na página "Carrinho", selecione "Finalizar Compra".',
                  "- Preencha os dados de faturação e envio.",
                  "- Escolha o método de pagamento preferido e conclua a encomenda.",
                  "Após confirmação do pagamento, receberá um e-mail de confirmação e a sua encomenda será processada e enviada.",
                ],
              },
              {
                question: "Posso alterar ou cancelar a minha encomenda?",
                answer: [
                  "Sim. Para alterar ou cancelar uma encomenda, contacte-nos por e-mail (palmanhac@gmail.com) ou por telefone/WhatsApp (964 690 254) em dias úteis, das 9h00 às 18h00.",
                  "As encomendas só podem ser canceladas se ainda não tiverem sido enviadas.",
                ],
              },
              {
                question: "Posso enviar uma encomenda como presente?",
                answer: [
                  'Sim. No momento da finalização da compra, selecione a opção "Enviar para outro endereço" e indique os dados do destinatário.',
                  "O presente será enviado sem fatura e sem etiquetas de preço.",
                ],
              },
              {
                question: "Quais os métodos de pagamento aceites?",
                answer: [
                  "Aceitamos cartões de crédito e débito (Visa, MasterCard, Maestro), MB Way, MultiBanco e transferência bancária.",
                  "Em caso de transferência, receberá os dados bancários necessários por e-mail.",
                ],
              },
              {
                question: "Existem taxas adicionais?",
                answer: [
                  "Não. O valor total inclui apenas o preço dos produtos e os custos de envio (quando aplicável).",
                ],
              },
              {
                question: "Como funcionam os reembolsos em caso de devolução?",
                answer: [
                  "De acordo com o Decreto-Lei nº 24/2014, os clientes podem devolver produtos até 14 dias após a receção.",
                  "Contacte-nos por e-mail (palmanhac@gmail.com) para iniciar o processo de devolução.",
                  "Os produtos devem ser devolvidos em perfeito estado e na embalagem original.",
                  "Os reembolsos são processados no prazo máximo de 30 dias após receção e verificação dos artigos devolvidos.",
                ],
              },
            ],
          },
          {
            id: "shipping",
            title: "4. Envio e Entrega",
            items: [
              {
                question: "Para que países enviam encomendas?",
                answer: [
                  "Atualmente, enviamos para Portugal Continental e Espanha.",
                  "Para outros destinos internacionais, contacte-nos através de info@palmanhac-shop.pt para verificar a possibilidade de envio.",
                ],
              },
              {
                question: "Com que transportadoras trabalham?",
                answer: ["Trabalhamos com a GLS, garantindo entregas seguras e fiáveis."],
              },
              {
                question: "Qual é o prazo médio de entrega?",
                answer: [
                  "O prazo habitual é de 1 a 4 dias úteis após a confirmação do pagamento.",
                  "As entregas para Espanha podem demorar um pouco mais, dependendo da logística e do tratamento aduaneiro.",
                  "Podem ocorrer atrasos devido a problemas da transportadora ou fatores externos fora do controlo da Palmanhac.",
                ],
              },
              {
                question: "Quais são os custos de envio?",
                answer: [
                  "- 6,00 € — 1 a 2 garrafas",
                  "- 8,00 € — 3 ou mais garrafas",
                  "- Grátis — para encomendas superiores a 60,00 €",
                ],
              },
              {
                question: "Quando será enviada a minha encomenda?",
                answer: [
                  "As encomendas são enviadas após a confirmação do pagamento.",
                  "O processamento e expedição geralmente demoram 1 dia útil.",
                ],
              },
              {
                question:
                  "O que devo fazer se a embalagem estiver danificada ou molhada?",
                answer: [
                  "Se notar danos no momento da entrega, recuse a encomenda e contacte-nos imediatamente.",
                  "Envie um e-mail para palmanhac@gmail.com ou ligue para 964 690 254 (dias úteis, das 9h00 às 18h00).",
                ],
              },
              {
                question: "O que acontece se uma garrafa partir durante o transporte?",
                answer: [
                  "Se a quebra ocorrer antes da entrega, será enviada uma nova encomenda sem custos adicionais.",
                  "Se detetar danos após a entrega, contacte-nos imediatamente para providenciar a substituição.",
                ],
              },
            ],
          },
          {
            id: "cookies",
            title: "5. Política de Cookies",
            items: [
              {
                question: "Qual é a política de cookies da Palmanhac?",
                answer: [
                  "Utilizamos cookies para que o website palmanhac-shop.pt funcione corretamente, memorize preferências essenciais e ofereça uma navegação mais fluida.",
                  "Ao continuar a navegação, concorda com esta Política de Cookies e consente a utilização de cookies nos termos descritos.",
                ],
              },
              {
                question: "O que são cookies?",
                answer: [
                  "São pequenos ficheiros guardados no seu dispositivo que suportam o funcionamento do website, melhoram a navegação e guardam determinadas preferências.",
                  "- Cookies de sessão — eliminados quando fecha o navegador.",
                  "- Cookies persistentes — permanecem no dispositivo até expirarem ou serem apagados.",
                  "Os cookies que utilizamos não recolhem informações que permitam identificar pessoalmente o utilizador e podem ser geridos ou bloqueados nas definições do navegador (desativar cookies essenciais pode afetar o funcionamento do website).",
                ],
              },
              {
                question: "Que cookies são utilizados em palmanhac-shop.pt?",
                answer: [
                  "Utilizamos apenas cookies estritamente necessários para:",
                  "- garantir o funcionamento da loja online;",
                  "- guardar preferências básicas do utilizador, como idioma ou estado do carrinho;",
                  "- melhorar a navegação e a usabilidade para facilitar a finalização das compras.",
                ],
              },
              {
                question: "Utilizam cookies de terceiros ou ferramentas analíticas?",
                answer: [
                  "Não. Não recorremos a cookies de terceiros nem utilizamos Google Analytics para recolher dados pessoais.",
                  "Em caso de dúvidas relacionadas com cookies, contacte-nos através de info@palmanhac-shop.pt.",
                ],
              },
            ],
          },
          {
            id: "privacy",
            title: "6. Política de Privacidade",
            items: [
              {
                question: "Em que consiste a Política de Privacidade da Palmanhac?",
                answer: [
                  "A Palmanhac respeita a privacidade de todos os utilizadores e processa os dados pessoais de acordo com o RGPD (Regulamento UE 2016/679).",
                  "O website pode ser navegado sem fornecer dados pessoais e apenas solicitamos informação quando estritamente necessária para encomendas, pedidos de contacto ou subscrições.",
                  "Esta Política aplica-se exclusivamente ao website palmanhac-shop.pt e não a websites externos referidos por links.",
                ],
              },
              {
                question: "Que dados pessoais podem ser recolhidos?",
                answer: [
                  "Consideram-se dados pessoais informações que permitam identificar o utilizador, como nome, morada, telefone, email, NIF, data de nascimento e preferências de compra.",
                  "Não recolhemos dados sensíveis e, sempre que fornece dados voluntariamente, consideramos que nos dá um consentimento claro, livre e informado.",
                  "Dependendo do pedido, podemos recolher:",
                  "- nome, morada de faturação e envio, país;",
                  "- email e telefone;",
                  "- NIF e data de nascimento quando exigido por lei;",
                  "- histórico de encomendas e registos de comunicação.",
                ],
              },
              {
                question: "Quem é o responsável pelo tratamento e como posso contactar?",
                answer: [
                  "O responsável pelo tratamento dos dados é a Palmanhac – palmanhac-shop.pt, que garante medidas de segurança adequadas.",
                  "Para questões sobre privacidade ou para exercer os seus direitos, contacte info@palmanhac-shop.pt.",
                ],
              },
              {
                question: "Para que finalidades os dados são utilizados?",
                answer: [
                  "Os dados são usados exclusivamente para:",
                  "- processar e enviar encomendas;",
                  "- emitir faturas e cumprir obrigações legais;",
                  "- gerir contas de cliente e prestar apoio;",
                  "- atender reclamações e realizar análises estatísticas internas;",
                  "- enviar campanhas, novidades ou newsletters (mediante consentimento).",
                  "O utilizador pode cancelar a receção de comunicações de marketing a qualquer momento.",
                ],
              },
              {
                question: "Durante quanto tempo os dados são conservados?",
                answer: [
                  "Os dados são mantidos apenas pelo período necessário para cumprir as finalidades a que se destinam ou pelo tempo imposto por lei (por exemplo, obrigações fiscais).",
                  "Pode solicitar a eliminação completa dos seus dados através de info@palmanhac-shop.pt.",
                ],
              },
              {
                question: "Os dados são partilhados com terceiros?",
                answer: [
                  "A Palmanhac apenas partilha dados pessoais com parceiros essenciais, como transportadoras, processadores de pagamento ou prestadores de serviços informáticos.",
                  "Todos os parceiros cumprem o RGPD, garantem confidencialidade e os dados nunca são vendidos ou cedidos para fins comerciais indevidos.",
                ],
              },
              {
                question: "Como são tratados os cookies e atualizações desta política?",
                answer: [
                  "Palmanhac-shop.pt utiliza cookies apenas para assegurar o bom funcionamento do website, recordar preferências e gerar estatísticas anonimizadas.",
                  "Pode desativar cookies no navegador, embora algumas funcionalidades possam ficar limitadas.",
                  "A Palmanhac poderá atualizar esta Política de Privacidade a qualquer momento; as alterações serão sempre publicadas nesta página.",
                ],
              },
            ],
          },
        ],
      },
      shippingReturns: {
        title: "Entregas e Devoluções",
        subtitle:
          "Informações essenciais sobre envios, devoluções e cuidado dos produtos.",
        shipping: {
          title: "Entregas",
          notes: [
            "As entregas são efetuadas entre as 8h00 e as 18h00, apenas em dias úteis.",
            "Os prazos de entrega podem variar em função de feriados, fins de semana, condições meteorológicas ou feriados nacionais.",
            "Caso o estafeta tente entregar a encomenda e o cliente não esteja disponível, será agendada uma nova tentativa de entrega.",
            "Após a confirmação da compra, o cliente receberá um e-mail com os detalhes dos artigos adquiridos e um número de seguimento, permitindo acompanhar o estado da entrega.",
            "O tempo médio de entrega, após expedição, para Portugal Continental é de 24 a 48 horas.",
          ],
          costsTitle: "Custos de entrega",
          costs: [
            "6€ para 1 ou 2 garrafas",
            "8€ para 3 ou mais garrafas",
            "Entrega gratuita para encomendas superiores a 60€",
          ],
          extraNotes: [
            "A Palmanhac utiliza embalagens seguras e personalizadas, concebidas para garantir a integridade dos produtos durante o transporte.",
          ],
        },
        returns: {
          title: "Devoluções",
          notes: [
            "De acordo com o Decreto-Lei n.º 24/2014, de 14 de fevereiro, o cliente tem o direito de devolver os produtos no prazo máximo de 14 dias a contar da data de receção da encomenda.",
            "As garrafas devem ser devolvidas nas mesmas condições em que foram recebidas — sem danos, fechadas e na embalagem original.",
            "A Palmanhac reserva-se o direito de recusar produtos que não cumpram estas condições.",
          ],
          exceptionsTitle: "Exceções",
          exceptions: [
            "Produtos abertos ou com selos de segurança violados",
            "Bebidas alcoólicas consideradas perecíveis",
          ],
          supportTitle: "Precisa de ajuda?",
          supportDetails: [
            "Se o produto estiver defeituoso, danificado durante o transporte ou se houver erro no envio, a Palmanhac procederá à substituição ou reembolso total.",
            "O pedido de devolução deve ser enviado para info@palmanhac-shop.pt ou +351 964 690 254 (dias úteis, das 9h00 às 18h00).",
            "Os reembolsos serão processados no prazo máximo de 30 dias após a receção e verificação do artigo devolvido.",
            "Caso a encomenda chegue em condições inadequadas, fotografe o artigo e a etiqueta traseira (onde o selo é visível) e envie as imagens por e-mail para que possamos agendar a recolha e substituição.",
          ],
        },
      },
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
        "A palavra-passe deve ter pelo menos 6 caracteres e incluir letras maiúsculas, minúsculas e números.",
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
      shippingNoticeTitle: "Disponibilidade de envios",
      multibancoNoticeTitle: "Multibanco temporariamente indisponível",
      multibancoNotice:
        "Os pagamentos por Multibanco estão temporariamente indisponíveis enquanto resolvemos o problema. Pode continuar a utilizar MB WAY e pagamentos por cartão. Para qualquer questão contacte info@palmanhac-shop.pt e teremos todo o gosto em ajudar.",
      confirmationNoticeTitle: "Precisa de ajuda com a confirmação?",
      confirmationNotice:
        "Se já confirmou o pagamento mas não recebeu um email, contacte info@palmanhac-shop.pt com o número da encomenda e teremos todo o gosto em ajudar.",
      contactInformation: "Informações de contacto",
      contactEmailLabel: "Email",
      contactPhoneLabel: "Telefone (opcional)",
      taxIdLabel: "NIF / TIN (opcional)",
      taxIdHelper: "Incluído no email e no comprovativo caso seja preenchido.",
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
        "Pague com segurança via EuPago (Multibanco / MB WAY) ou Stripe para cartões.",
      paymentMethodLabel: "Escolha o método de pagamento",
      paymentServiceUnavailable:
        "Os pagamentos não estão disponíveis neste momento. Tente novamente em breve.",
      startPaymentCta: "Finalizar encomenda",
      processingPayment: "A processar pagamento...",
      mbwayPhoneLabel: "Telemóvel MB WAY",
      mbwayPhonePlaceholder: "ex.: +351912345678",
      mbwayPhoneRequired: "Indique um número de telefone para MB WAY.",
      pendingHeading: "Encomenda registada — confirme o pagamento",
      pendingSubheading:
        "Atualizaremos o estado automaticamente assim que a EuPago confirmar.",
      pendingDescription:
        "Aprove o pedido na app MB WAY. Se já confirmou, mantenha esta página aberta ou visite as encomendas para acompanhar o estado.",
      pendingStatusLabel: "Estado em tempo real",
      pendingStatusAwaiting: "A aguardar aprovação na app MB WAY.",
      pendingStatusPaid: "Pagamento confirmado. A redirecionar para Encomendas…",
      pendingStatusFailed:
        "O pagamento não foi aprovado. Pode escolher outro método na página de Encomendas.",
      pendingHint:
        "Já confirmou o pagamento? Visite a página de Encomendas para ver o estado mais recente.",
      pendingRefresh: "Atualizar estado",
      pendingOrdersCta: "Ver Encomendas",
      pendingSupportMessage:
        "Se já confirmou o pagamento na aplicação MB WAY mas o estado não está a atualizar aqui, por favor contacte-nos através de info@palmanhac-shop.pt com a referência {orderId}. Teremos todo o gosto em ajudar.",
      pendingMissingOrder:
        "Não encontrámos a referência da encomenda. Volte a tentar a partir do checkout.",
      methods: {
        multibanco: "Multibanco",
        mbway: "MB WAY",
        card: "Cartão",
      },
      methodDescriptions: {
        multibanco:
          "Pague mais tarde no Multibanco ou homebanking com a referência gerada.",
        mbway: "Aprove o pedido na app MB WAY para confirmar de imediato.",
        card: "Pagamento seguro com cartão através da Stripe.",
      },
      resultHeading: "Instruções de pagamento",
      resultInstructions: {
        multibanco: "Use estes dados para concluir o pagamento via Multibanco.",
        mbway: "Aprove o pagamento na app MB WAY para confirmar a encomenda.",
        card: "Introduza os dados do cartão abaixo para pagar com a Stripe.",
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
        "Conclua o pagamento no formulário acima. A Stripe pode pedir uma verificação adicional.",
      cardDetailsLabel: "Dados do cartão",
      cardUnavailable:
        "Os pagamentos com cartão estão temporariamente indisponíveis. Escolha outro método.",
      cardInitializing: "O Stripe ainda está a carregar. Aguarde um momento.",
      cardElementUnavailable:
        "Não foi possível iniciar o formulário do cartão. Atualize a página e tente novamente.",
      cardDetailsIncomplete: "Preencha os dados do cartão antes de continuar.",
      cardErrorFallback:
        "Não foi possível confirmar o pagamento com cartão. Tente novamente com outro cartão.",
      cardProcessingMessage:
        "A confirmar o pagamento com cartão de forma segura através da Stripe.",
      cardStatusProcessing:
        "A confirmar o pagamento com a Stripe. Normalmente demora apenas alguns segundos.",
      cardStatusSuccess: "Pagamento confirmado. A redirecionar para Encomendas…",
      cardStatusPending: "Pagamento criado — a atualizar o estado.",
      cardSuccessHeading: "Pagamento confirmado",
      cardSuccessMessage:
        "Obrigado! O pagamento foi concluído e estamos a preparar a encomenda. Consulte os detalhes mais recentes na página de Encomendas.",
      cardPendingHeading: "Pagamento pendente",
      cardPendingProcessing:
        "A Stripe ainda está a processar este pagamento. Normalmente demora menos de um minuto.",
      cardPendingGeneric:
        "A Stripe identificou este pagamento como “{status}”. Atualizaremos automaticamente a página de Encomendas assim que houver alterações.",
      cardFinalizeWarning:
        "O pagamento foi concluído, mas não conseguimos atualizar a encomenda automaticamente. Verifique a página de Encomendas para confirmar o estado.",
      thankYouHeading: "Obrigado pela sua compra!",
      thankYouSubheading:
        "Estamos a preparar a sua encomenda Palmanhac. Pode acompanhar as atualizações sempre que precisar.",
      thankYouOrdersCta: "Voltar às minhas encomendas",
      thankYouTrackCta: "Acompanhar esta encomenda",
      thankYouOrderLabel: "Referência da encomenda",
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
      paymentMethodLabel: "Método de pagamento",
      paymentMethodUnknown: "Não indicado",
      statusDetails: {
        mbwayPending:
          "A aguardar aprovação na app MB WAY. Confirme o pagamento no telemóvel ou aguarde a atualização automática.",
        multibancoPending:
          "A aguardar pagamento Multibanco. Utilize a referência gerada e a encomenda atualizará automaticamente após o pagamento.",
        cardPending:
          "A aguardar confirmação do cartão na Stripe. Termine o pagamento para atualizar esta encomenda.",
        paid: "Pagamento recebido. Não é necessária nenhuma ação adicional.",
      },
      pendingSupportMessage:
        "Se já confirmou este pagamento mas continua pendente, envie um email para info@palmanhac-shop.pt com a referência {orderId} e teremos todo o gosto em ajudar.",
      viewDetails: "Ver detalhes",
      searchLabel: "Pesquisar encomendas",
      searchPlaceholder: "Procure por nº de encomenda, referência ou produto",
      searchEmpty: "Nenhuma encomenda corresponde a essa pesquisa.",
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
        "Entregas em 24–48h em Portugal Continental. Portes gratuitos para encomendas superiores a 60€.",
      addressHeading: "Atendimento ao Cliente",
      addressLines: [
        "KARMUXILON LDA",
        "Palmanhac",
        "Destilaria-Adega Rua de Mercúrio lote 38",
        "Vale do Alecrim, Palmela",
        "Código Postal 2950-019",
        "Tel.: T.964 690 254",
        "Site: www.palmanhac.pt",
        "Email: info@palmanhac-shop.pt",
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
      discount: {
        badge: "Desconto ativo",
        percentLabel: "Desconto (%)",
        savingsLabel: "Poupe {percent}%",
      },
      reviews: {
        heading: "Avaliações",
        averageLabel: "Classificação média",
        writeReview: "Escreva uma avaliação",
        ratingLabel: "Classificação",
        commentLabel: "Comentário",
        guestNameLabel: "Nome (opcional)",
        guestEmailLabel: "Email (opcional)",
        submit: "Enviar avaliação",
        success: "Obrigado! A sua avaliação foi registada.",
        error: "Não foi possível enviar a avaliação. Tente novamente.",
        empty: "Ainda não existem avaliações.",
        countLabel: "{count} avaliações",
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
