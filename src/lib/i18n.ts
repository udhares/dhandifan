"use client";

import { useEffect, useState } from "react";

export type Lang = "en" | "dv";
type Entry = { en: string; dv: string };

// Only the customer-facing strings are translated. Farmer admin stays English.
const DICT: Record<string, Entry> = {
  shop: { en: "Shop", dv: "ފިހާރަ" },
  account: { en: "Account", dv: "އެކައުންޓު" },
  freshFrom: { en: "Fresh from Dhandifan", dv: "ދަނޑިފަން – ތާޒާކަމާއިއެކު" },

  search: { en: "Search produce...", dv: "ހޯދާ" },
  newest: { en: "Newest", dv: "އެންމެ ފަސް" },
  priceLow: { en: "Price: low to high", dv: "އަގު: ކުޑައިން ބޮޑަށް" },
  priceHigh: { en: "Price: high to low", dv: "އަގު: ބޮޑުން ކުޑައަށް" },
  all: { en: "All", dv: "ހުރިހާ" },
  fruit: { en: "Fruit", dv: "މޭވާ" },
  vegetable: { en: "Vegetable", dv: "ތަރުކާރީ" },
  herb: { en: "Herb", dv: "ފަތްޕިލާވެލި" },
  other: { en: "Other", dv: "އެހެނިހެން" },
  soldOut: { en: "Sold out", dv: "ހުސްވެފަ" },
  certified: { en: "Certified", dv: "ސެޓިފައިޑް" },
  add: { en: "Add", dv: "އިތުރުކޮށްލާ" },
  noMatch: { en: "No produce matches your search.", dv: "ހޯދި އެއްޗެއް ނުފެނުނު." },

  checkout: { en: "Checkout", dv: "ފައިސާދެއްކެވުމަށް" },
  yourOrder: { en: "Your order", dv: "ތިބާގެ އޯޑަރު" },
  total: { en: "Total", dv: "ޖުމްލަ" },
  yourName: { en: "Your name", dv: "ނަން" },
  phone: { en: "Phone number", dv: "ފޯނުނަންބަރު" },
  deliveryMethod: { en: "Delivery method", dv: "ގެންގޮސްދޭނެގޮތް" },
  deliveryAddress: { en: "Delivery address / note", dv: "ގެންގޮސްދޭންވީ އެޑްރެސް / އިތުރު ނޯޓެއް" },
  placeOrder: { en: "Place order", dv: "އޯޑަރުކުރައްވާ" },
  back: { en: "Back", dv: "ފަހަތައް" },
  close: { en: "Close", dv: "ފަހަތައް" },
  orderPlaced: { en: "Order placed!", dv: "އޯޑަރުކުރެވިއްޖެ" },
  reference: { en: "Reference", dv: "ރިފަރެންސް" },
  payByTransfer: { en: "Pay by bank transfer", dv: "ޓްރާންސްފަރކުރައްވާ" },
  accountNumber: { en: "Account number", dv: "އެކައުންޓު ނަންބަރު" },
  amount: { en: "Amount", dv: "ޢަދަދު" },
  transferRef: { en: "Your transfer reference (after you pay)", dv: "ޓްރާންސްފަރ ސްލިޕްގައިވާ ރިފަރެންސް ނަންބަރު" },
  ivePaid: { en: "I've paid", dv: "ފައިސާދެއްކިއްޖެ" },
  thankYou: { en: "Thank you!", dv: "ޝުކުރިއްޔާ!" },

  delivDhoni: { en: "Dhoni / boat to Malé", dv: "ދޯނީގައި މާލެއަށް" },
  delivFerry: { en: "Ferry / terminal pickup", dv: "ފެރީ / ޓާމިނަލުން ނަގާ" },
  delivHome: { en: "Home delivery on the island", dv: "ރަށުގައި ގެއަށް ރައްދުކޮށްދިނުން" },
  delivOwn: { en: "I'll arrange my own transport", dv: "ގެންދިޔުމުގެ ކަންކަން އަމިއްލައަށް ހަމަޖައްސާނަން" },

  welcomeBack: { en: "Welcome back", dv: "މަރުޙަބާ" },
  createAccount: { en: "Create your account", dv: "އެކައުންޓު ހެދުމަށް" },
  login: { en: "Log in", dv: "ލޮގްއިން" },
  signup: { en: "Sign up", dv: "ސައިންއަޕް" },
  logout: { en: "Log out", dv: "ލޮގްއައުޓް" },
  loyaltyPoints: { en: "Your loyalty points", dv: "ދަނޑިފަން ޕޮއިންޓު" },
  yourOrders: { en: "Your orders", dv: "އޯޑަރުތައް" },
  savedAddress: { en: "Saved delivery address", dv: "ކުރީގެ ޑެލިވަރީ އެޑްރެސް" },
  save: { en: "Save", dv: "ސޭވް" },
  password: { en: "Password", dv: "ޕާސްވަރޑް" },
};

export function t(key: string, lang: Lang): string {
  const e = DICT[key];
  if (!e) return key;
  return e[lang] || e.en;
}

function readLang(): Lang {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("lang") as Lang) || "en";
}

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const apply = () => {
      const l = readLang();
      setLangState(l);
      document.documentElement.setAttribute("dir", l === "dv" ? "rtl" : "ltr");
    };
    apply();
    window.addEventListener("langchange", apply);
    return () => window.removeEventListener("langchange", apply);
  }, []);

  const change = (l: Lang) => {
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
    setLangState(l);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("dir", l === "dv" ? "rtl" : "ltr");
    }
    window.dispatchEvent(new Event("langchange"));
  };

  return [lang, change];
}
