import { api } from "~/utils/api";

export function getCurrencySymbol(shorName: string): string | undefined {
  const currency = currencies.find((c) => c.shortName === shorName);
  if (!currency) return undefined;
  return currency.symbol;
}

export function getOrganizationCurrency(
  organizationId: string | undefined
): string {
  if (!organizationId) return "USD";
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const organization = api.organization?.getOrganizationCurrencyFromId.useQuery(
    { id: organizationId }
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const organizationCurrency = organization.data?.currency ?? "USD";
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return organizationCurrency;
}

export function formatMoney(number: number | string) {
  if (typeof number === "string") return number;
  const decPlaces = 2;
  const decSep = ".";
  const thouSep = ",";
  const sign = "";
  const i = String(
    parseInt((number = Math.abs(Number(number) || 0).toFixed(decPlaces)))
  );
  let j;
  j = (j = i.length) > 3 ? j % 3 : 0;

  return (
    sign +
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    (j ? i.substring(0, j) + thouSep : "") +
    i.substring(j).replace(/(\decSep{3})(?=\decSep)/g, "$1" + thouSep) +
    (decPlaces
      ? decSep +
      Math.abs(parseInt(number) - parseInt(i))
        .toFixed(decPlaces)
        .slice(2)
      : "")
  );
}

export const currencies = [
  {
    shortName: "AED",
    name: "United Arab Emirates Dirham",
    symbol: "د.إ",
  },
  {
    shortName: "INR",
    name: "Indian Rupee",
    symbol: "₹",
  },
  {
    shortName: "USD",
    name: "United States Dollar",
    symbol: "$",
  },
  {
    shortName: "CAD",
    name: "Canadian Dollar",
    symbol: "$",
  },
  {
    shortName: "EUR",
    name: "Euro",
    symbol: "€",
  },
  {
    shortName: "GBP",
    name: "British Pound",
    symbol: "£",
  },
  {
    shortName: "AFN",
    name: "Afghan Afghani",
    symbol: "؋",
  },
  {
    shortName: "ALL",
    name: "Albanian Lek",
    symbol: "L",
  },
  {
    shortName: "AMD",
    name: "Armenian Dram",
    symbol: "֏",
  },
  {
    shortName: "ANG",
    name: "Netherlands Antillean Guilder",
    symbol: "ƒ",
  },
  {
    shortName: "AOA",
    name: "Angolan Kwanza",
    symbol: "Kz",
  },
  {
    shortName: "ARS",
    name: "Argentine Peso",
    symbol: "$",
  },
  {
    shortName: "AUD",
    name: "Australian Dollar",
    symbol: "$",
  },
  {
    shortName: "AWG",
    name: "Aruban Florin",
    symbol: "ƒ",
  },
  {
    shortName: "AZN",
    name: "Azerbaijani Manat",
    symbol: "₼",
  },
  {
    shortName: "BAM",
    name: "Bosnia and Herzegovina Convertible Mark",
    symbol: "KM",
  },
  {
    shortName: "BBD",
    name: "Barbadian or Bajan Dollar",
    symbol: "$",
  },
  {
    shortName: "BDT",
    name: "Bangladeshi Taka",
    symbol: "৳",
  },
  {
    shortName: "BGN",
    name: "Bulgarian Lev",
    symbol: "лв",
  },
  {
    shortName: "BHD",
    name: "Bahraini Dinar",
    symbol: ".د.ب",
  },
  {
    shortName: "BIF",
    name: "Burundian Franc",
    symbol: "FBu",
  },
  {
    shortName: "BMD",
    name: "Bermudian Dollar",
    symbol: "$",
  },
  {
    shortName: "BND",
    name: "Bruneian Dollar",
    symbol: "$",
  },
  {
    shortName: "BOB",
    name: "Bolivian Bolíviano",
    symbol: "$b",
  },
  {
    shortName: "BOV",
    name: "Bolivian Mvdol",
    symbol: "BOV",
  },
  {
    shortName: "BRL",
    name: "Brazilian Real",
    symbol: "R$",
  },
  {
    shortName: "BSD",
    name: "Bahamian Dollar",
    symbol: "$",
  },
  {
    shortName: "BTC",
    name: "Bitcoin",
    symbol: "₿",
  },
  {
    shortName: "BTN",
    name: "Bhutanese Ngultrum",
    symbol: "Nu.",
  },
  {
    shortName: "BWP",
    name: "Botswana Pula",
    symbol: "P",
  },
  {
    shortName: "BYN",
    name: "Belarusian Ruble",
    symbol: "Br",
  },
  {
    shortName: "BYR",
    name: "Belarusian Ruble",
    symbol: "Br",
  },
  {
    shortName: "BZD",
    name: "Belizean Dollar",
    symbol: "BZ$",
  },
  {
    shortName: "CDF",
    name: "Congolese Franc",
    symbol: "FC",
  },
  {
    shortName: "CHE",
    name: "WIR Euro (Complementary Currency)",
    symbol: "CHE",
  },
  {
    shortName: "CHF",
    name: "Swiss Franc",
    symbol: "CHF",
  },
  {
    shortName: "CHW",
    name: "WIR Franc (Complementary Currency)",
    symbol: "CHW",
  },
  {
    shortName: "CLF",
    name: "Unidad de Fomento (Funds Code)",
    symbol: "CLF",
  },
  {
    shortName: "CLP",
    name: "Chilean Peso",
    symbol: "$",
  },
  {
    shortName: "CNH",
    name: "Chinese Yuan Renminbi (Offshore)",
    symbol: "¥",
  },
  {
    shortName: "CNY",
    name: "Chinese Yuan Renminbi",
    symbol: "¥",
  },
  {
    shortName: "COP",
    name: "Colombian Peso",
    symbol: "$",
  },
  {
    shortName: "COU",
    name: "Unidad de Valor Real",
    symbol: "COU",
  },
  {
    shortName: "CRC",
    name: "Costa Rican Colon",
    symbol: "₡",
  },
  {
    shortName: "CUC",
    name: "Cuban Convertible Peso",
    symbol: "$",
  },
  {
    shortName: "CUP",
    name: "Cuban Peso",
    symbol: "₱",
  },
  {
    shortName: "CVE",
    name: "Cape Verdean Escudo",
    symbol: "$",
  },
  {
    shortName: "CZK",
    name: "Czech Koruna",
    symbol: "Kč",
  },
  {
    shortName: "DJF",
    name: "Djiboutian Franc",
    symbol: "Fdj",
  },
  {
    shortName: "DKK",
    name: "Danish Krone",
    symbol: "kr",
  },
  {
    shortName: "DOP",
    name: "Dominican Peso",
    symbol: "RD$",
  },
  {
    shortName: "DZD",
    name: "Algerian Dinar",
    symbol: "دج",
  },
  {
    shortName: "EEK",
    name: "Estonian Kroon",
    symbol: "kr",
  },
  {
    shortName: "EGP",
    name: "Egyptian Pound",
    symbol: "£",
  },
  {
    shortName: "ERN",
    name: "Eritrean Nakfa",
    symbol: "Nfk",
  },
  {
    shortName: "ETB",
    name: "Ethiopian Birr",
    symbol: "Br",
  },
  {
    shortName: "ETH",
    name: "Ethereum",
    symbol: "Ξ",
  },
  {
    shortName: "FJD",
    name: "Fijian Dollar",
    symbol: "$",
  },
  {
    shortName: "FKP",
    name: "Falkland Island Pound",
    symbol: "£",
  },
  {
    shortName: "GEL",
    name: "Georgian Lari",
    symbol: "₾",
  },
  {
    shortName: "GGP",
    name: "Guernsey Pound",
    symbol: "£",
  },
  {
    shortName: "GHC",
    name: "Ghanaian Cedi",
    symbol: "₵",
  },
  {
    shortName: "GHS",
    name: "Ghanaian Cedi",
    symbol: "GH₵",
  },
  {
    shortName: "GIP",
    name: "Gibraltar Pound",
    symbol: "£",
  },
  {
    shortName: "GMD",
    name: "Gambian Dalasi",
    symbol: "D",
  },
  {
    shortName: "GNF",
    name: "Guinean Franc",
    symbol: "FG",
  },
  {
    shortName: "GTQ",
    name: "Guatemalan Quetzal",
    symbol: "Q",
  },
  {
    shortName: "GYD",
    name: "Guyanese Dollar",
    symbol: "$",
  },
  {
    shortName: "HKD",
    name: "Hong Kong Dollar",
    symbol: "$",
  },
  {
    shortName: "HNL",
    name: "Honduran Lempira",
    symbol: "L",
  },
  {
    shortName: "HRK",
    name: "Croatian Kuna",
    symbol: "kn",
  },
  {
    shortName: "HTG",
    name: "Haitian Gourde",
    symbol: "G",
  },
  {
    shortName: "HUF",
    name: "Hungarian Forint",
    symbol: "Ft",
  },
  {
    shortName: "IDR",
    name: "Indonesian Rupiah",
    symbol: "Rp",
  },
  {
    shortName: "ILS",
    name: "Israeli Shekel",
    symbol: "₪",
  },
  {
    shortName: "IMP",
    name: "Isle of Man Pound",
    symbol: "£",
  },
  {
    shortName: "IQD",
    name: "Iraqi Dinar",
    symbol: "ع.د",
  },
  {
    shortName: "IRR",
    name: "Iranian Rial",
    symbol: "﷼",
  },
  {
    shortName: "ISK",
    name: "Icelandic Króna",
    symbol: "kr",
  },
  {
    shortName: "JEP",
    name: "Jersey Pound",
    symbol: "£",
  },
  {
    shortName: "JMD",
    name: "Jamaican Dollar",
    symbol: "J$",
  },
  {
    shortName: "JOD",
    name: "Jordanian Dinar",
    symbol: "JD",
  },
  {
    shortName: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
  },
  {
    shortName: "KES",
    name: "Kenyan Shilling",
    symbol: "KSh",
  },
  {
    shortName: "KGS",
    name: "Kyrgyzstani Som",
    symbol: "лв",
  },
  {
    shortName: "KHR",
    name: "Cambodian Riel",
    symbol: "៛",
  },
  {
    shortName: "KMF",
    name: "Comorian Franc",
    symbol: "CF",
  },
  {
    shortName: "KPW",
    name: "North Korean Won",
    symbol: "₩",
  },
  {
    shortName: "KRW",
    name: "South Korean Won",
    symbol: "₩",
  },
  {
    shortName: "KWD",
    name: "Kuwaiti Dinar",
    symbol: "KD",
  },
  {
    shortName: "KYD",
    name: "Caymanian Dollar",
    symbol: "$",
  },
  {
    shortName: "KZT",
    name: "Kazakhstani Tenge",
    symbol: "₸",
  },
  {
    shortName: "LAK",
    name: "Lao or Laotian Kip",
    symbol: "₭",
  },
  {
    shortName: "LBP",
    name: "Lebanese Pound",
    symbol: "£",
  },
  {
    shortName: "LKR",
    name: "Sri Lankan Rupee",
    symbol: "₨",
  },
  {
    shortName: "LRD",
    name: "Liberian Dollar",
    symbol: "$",
  },
  {
    shortName: "LSL",
    name: "Basotho Loti",
    symbol: "M",
  },
  {
    shortName: "LTC",
    name: "Litecoin",
    symbol: "Ł",
  },
  {
    shortName: "LTL",
    name: "Lithuanian Litas",
    symbol: "Lt",
  },
  {
    shortName: "LVL",
    name: "Latvian Lats",
    symbol: "Ls",
  },
  {
    shortName: "LYD",
    name: "Libyan Dinar",
    symbol: "LD",
  },
  {
    shortName: "MAD",
    name: "Moroccan Dirham",
    symbol: "MAD",
  },
  {
    shortName: "MDL",
    name: "Moldovan Leu",
    symbol: "lei",
  },
  {
    shortName: "MGA",
    name: "Malagasy Ariary",
    symbol: "Ar",
  },
  {
    shortName: "MKD",
    name: "Macedonian Denar",
    symbol: "ден",
  },
  {
    shortName: "MMK",
    name: "Burmese Kyat",
    symbol: "K",
  },
  {
    shortName: "MNT",
    name: "Mongolian Tughrik",
    symbol: "₮",
  },
  {
    shortName: "MOP",
    name: "Macau Pataca",
    symbol: "MOP$",
  },
  {
    shortName: "MRO",
    name: "Mauritanian Ouguiya",
    symbol: "UM",
  },
  {
    shortName: "MRU",
    name: "Mauritanian Ouguiya",
    symbol: "UM",
  },
  {
    shortName: "MUR",
    name: "Mauritian Rupee",
    symbol: "₨",
  },
  {
    shortName: "MVR",
    name: "Maldivian Rufiyaa",
    symbol: "Rf",
  },
  {
    shortName: "MWK",
    name: "Malawian Kwacha",
    symbol: "MK",
  },
  {
    shortName: "MXN",
    name: "Mexican Peso",
    symbol: "$",
  },
  {
    shortName: "MXV",
    name: "Mexican Unidad de Inversion (UDI)",
    symbol: "MXV",
  },
  {
    shortName: "MYR",
    name: "Malaysian Ringgit",
    symbol: "RM",
  },
  {
    shortName: "MZN",
    name: "Mozambican Metical",
    symbol: "MT",
  },
  {
    shortName: "NAD",
    name: "Namibian Dollar",
    symbol: "$",
  },
  {
    shortName: "NGN",
    name: "Nigerian Naira",
    symbol: "₦",
  },
  {
    shortName: "NIO",
    name: "Nicaraguan Cordoba",
    symbol: "C$",
  },
  {
    shortName: "NOK",
    name: "Norwegian Krone",
    symbol: "kr",
  },
  {
    shortName: "NPR",
    name: "Nepalese Rupee",
    symbol: "₨",
  },
  {
    shortName: "NZD",
    name: "New Zealand Dollar",
    symbol: "$",
  },
  {
    shortName: "OMR",
    name: "Omani Rial",
    symbol: "﷼",
  },
  {
    shortName: "PAB",
    name: "Panamanian Balboa",
    symbol: "B/.",
  },
  {
    shortName: "PEN",
    name: "Peruvian Sol",
    symbol: "S/.",
  },
  {
    shortName: "PGK",
    name: "Papua New Guinean Kina",
    symbol: "K",
  },
  {
    shortName: "PHP",
    name: "Philippine Peso",
    symbol: "₱",
  },
  {
    shortName: "PKR",
    name: "Pakistani Rupee",
    symbol: "₨",
  },
  {
    shortName: "PLN",
    name: "Polish Zloty",
    symbol: "zł",
  },
  {
    shortName: "PYG",
    name: "Paraguayan Guarani",
    symbol: "Gs",
  },
  {
    shortName: "QAR",
    name: "Qatari Riyal",
    symbol: "﷼",
  },
  {
    shortName: "RMB",
    name: "Chinese Yuan Renminbi (Onshore)",
    symbol: "￥",
  },
  {
    shortName: "RON",
    name: "Romanian Leu",
    symbol: "lei",
  },
  {
    shortName: "RSD",
    name: "Serbian Dinar",
    symbol: "Дин.",
  },
  {
    shortName: "RUB",
    name: "Russian Ruble",
    symbol: "₽",
  },
  {
    shortName: "RWF",
    name: "Rwandan Franc",
    symbol: "R₣",
  },
  {
    shortName: "SAR",
    name: "Saudi Arabian Riyal",
    symbol: "﷼",
  },
  {
    shortName: "SBD",
    name: "Solomon Islander Dollar",
    symbol: "$",
  },
  {
    shortName: "SCR",
    name: "Seychellois Rupee",
    symbol: "₨",
  },
  {
    shortName: "SDG",
    name: "Sudanese Pound",
    symbol: "ج.س.",
  },
  {
    shortName: "SEK",
    name: "Swedish Krona",
    symbol: "kr",
  },
  {
    shortName: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
  },
  {
    shortName: "SHP",
    name: "Saint Helenian Pound",
    symbol: "£",
  },
  {
    shortName: "SLL",
    name: "Sierra Leonean Leone",
    symbol: "Le",
  },
  {
    shortName: "SOS",
    name: "Somali Shilling",
    symbol: "S",
  },
  {
    shortName: "SRD",
    name: "Surinamese Dollar",
    symbol: "$",
  },
  {
    shortName: "SSP",
    name: "South Sudanese Pound",
    symbol: "£",
  },
  {
    shortName: "STD",
    name: "São Toméan Dobra",
    symbol: "Db",
  },
  {
    shortName: "STN",
    name: "São Toméan Dobra",
    symbol: "Db",
  },
  {
    shortName: "SVC",
    name: "Salvadoran Colon",
    symbol: "$",
  },
  {
    shortName: "SYP",
    name: "Syrian Pound",
    symbol: "£",
  },
  {
    shortName: "SZL",
    name: "Swazi Lilangeni",
    symbol: "E",
  },
  {
    shortName: "THB",
    name: "Thai Baht",
    symbol: "฿",
  },
  {
    shortName: "TJS",
    name: "Tajikistani Somoni",
    symbol: "SM",
  },
  {
    shortName: "TMT",
    name: "Turkmenistani Manat",
    symbol: "T",
  },
  {
    shortName: "TND",
    name: "Tunisian Dinar",
    symbol: "د.ت",
  },
  {
    shortName: "TOP",
    name: "Tongan Pa'anga",
    symbol: "T$",
  },
  {
    shortName: "TRL",
    name: "Turkish Lira (Obsolete)",
    symbol: "₤",
  },
  {
    shortName: "TRY",
    name: "Turkish Lira",
    symbol: "₺",
  },
  {
    shortName: "TTD",
    name: "Trinidadian Dollar",
    symbol: "TT$",
  },
  {
    shortName: "TVD",
    name: "Tuvaluan Dollar",
    symbol: "$",
  },
  {
    shortName: "TWD",
    name: "Taiwan New Dollar",
    symbol: "NT$",
  },
  {
    shortName: "TZS",
    name: "Tanzanian Shilling",
    symbol: "TSh",
  },
  {
    shortName: "UAH",
    name: "Ukrainian Hryvnia",
    symbol: "₴",
  },
  {
    shortName: "UGX",
    name: "Ugandan Shilling",
    symbol: "USh",
  },
  {
    shortName: "UYI",
    name: "Uruguayan Peso en Unidades Indexadas",
    symbol: "UYI",
  },
  {
    shortName: "UYU",
    name: "Uruguayan Peso",
    symbol: "$U",
  },
  {
    shortName: "UYW",
    name: "Unidad Previsional",
    symbol: "UYW",
  },
  {
    shortName: "UZS",
    name: "Uzbekistani Som",
    symbol: "лв",
  },
  {
    shortName: "VEF",
    name: "Venezuelan Bolívar",
    symbol: "Bs",
  },
  {
    shortName: "VES",
    name: "Venezuelan Bolívar Soberano",
    symbol: "Bs.S",
  },
  {
    shortName: "VND",
    name: "Vietnamese Dong",
    symbol: "₫",
  },
  {
    shortName: "VUV",
    name: "Ni-Vanuatu Vatu",
    symbol: "VT",
  },
  {
    shortName: "WST",
    name: "Samoan Tala",
    symbol: "WS$",
  },
  {
    shortName: "XAF",
    name: "Central African CFA Franc BEAC",
    symbol: "FCFA",
  },
  {
    shortName: "XBT",
    name: "Bitcoin",
    symbol: "Ƀ",
  },
  {
    shortName: "XCD",
    name: "East Caribbean Dollar",
    symbol: "$",
  },
  {
    shortName: "XOF",
    name: "West African CFA Franc",
    symbol: "CFA",
  },
  {
    shortName: "XPF",
    name: "CFP Franc",
    symbol: "₣",
  },
  {
    shortName: "XSU",
    name: "Sucre",
    symbol: "Sucre",
  },
  {
    shortName: "XUA",
    name: "ADB Unit of Account",
    symbol: "XUA",
  },
  {
    shortName: "YER",
    name: "Yemeni Rial",
    symbol: "﷼",
  },
  {
    shortName: "ZAR",
    name: "South African Rand",
    symbol: "R",
  },
  {
    shortName: "ZMW",
    name: "Zambian Kwacha",
    symbol: "ZK",
  },
  {
    shortName: "ZWD",
    name: "Zimbabwean Dollar",
    symbol: "Z$",
  },
];
