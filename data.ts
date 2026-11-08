import { ASSETS } from "../assets";

export type FlavorId = "classic" | "lime";
export type PanelId = "ingredients" | "taste" | "eco" | "reviews" | "contact";
export type PackId = "single" | "six" | "twelve";

export interface FlavorDef {
  id: FlavorId;
  num: string;
  name: string;
  fruit: string;
  sub: string;
  description: string;
  can: string;
  sprite: string;
  tiltExtra: number;
  colors: {
    inner: string;
    mid: string;
    outer: string;
    glow: string;
    bubble: string;
    chip: string;
  };
  notes: string[];
  meters: { label: string; value: number }[];
  ingredients: string[];
}

export const FLAVORS: Record<FlavorId, FlavorDef> = {
  classic: {
    id: "classic",
    num: "Nº 01",
    name: "Diet Classic",
    fruit: "Cherry",
    sub: "Dark cherry · Zero sugar",
    description:
      "Unleash the crisp taste of zero sugar. Refreshment redefined in every bubble — all in one sleek can.",
    can: ASSETS.canClassic,
    sprite: ASSETS.cherry,
    tiltExtra: 0,
    colors: {
      inner: "#0b8a78",
      mid: "#044e3b",
      outer: "#011411",
      glow: "#10b981",
      bubble: "#8df2cf",
      chip: "#ff5d73",
    },
    notes: ["Morello cherry", "Vanilla whisper", "Cold spring finish"],
    meters: [
      { label: "Cherry depth", value: 90 },
      { label: "Carbonation", value: 95 },
      { label: "Acidity", value: 45 },
      { label: "Sweetness", value: 34 },
      { label: "Lingering aftertaste", value: 8 },
    ],
    ingredients: [
      "Carbonated spring water",
      "Dark morello cherry extract",
      "Citric acid",
      "Natural botanical flavors",
      "Stevia leaf extract",
      "Nothing artificial. Ever.",
    ],
  },
  lime: {
    id: "lime",
    num: "Nº 02",
    name: "Zero Lime",
    fruit: "Lime",
    sub: "Cold-pressed lime · Zero sugar",
    description:
      "A bolt of cold-pressed lime over glacier-cold fizz. Sharp, electric, and gone before the sugar ever arrives.",
    can: ASSETS.canLime,
    sprite: ASSETS.lime,
    tiltExtra: 9,
    colors: {
      inner: "#0b4f8a",
      mid: "#04294e",
      outer: "#010c14",
      glow: "#3b82f6",
      bubble: "#8ec8ff",
      chip: "#b5ef53",
    },
    notes: ["Makrut lime zest", "Yuzu edge", "Sea-salt sparkle"],
    meters: [
      { label: "Lime zest", value: 92 },
      { label: "Carbonation", value: 95 },
      { label: "Acidity", value: 70 },
      { label: "Sweetness", value: 28 },
      { label: "Lingering aftertaste", value: 6 },
    ],
    ingredients: [
      "Carbonated spring water",
      "Cold-pressed makrut lime oil",
      "Citric acid",
      "Natural citrus flavors",
      "Stevia leaf extract",
      "Nothing artificial. Ever.",
    ],
  },
};

export const FLAVOR_ORDER: FlavorId[] = ["classic", "lime"];

export interface PackDef {
  id: PackId;
  label: string;
  short: string;
  cans: number;
  price: number;
}

export const PACKS: PackDef[] = [
  { id: "single", label: "Single · 330 ml", short: "Single", cans: 1, price: 2.99 },
  { id: "six", label: "6-pack · 330 ml cans", short: "6-pack", cans: 6, price: 15.99 },
  { id: "twelve", label: "12-pack · 330 ml cans", short: "12-pack", cans: 12, price: 28.99 },
];

export const packById = (id: PackId): PackDef => PACKS.find((p) => p.id === id) ?? PACKS[0];
export const money = (n: number) => `$${n.toFixed(2)}`;
export const FREE_SHIP_AT = 25;

export interface CartItem {
  flavor: FlavorId;
  pack: PackId;
  qty: number;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  flavor: FlavorId;
  text: string;
  date: string;
}

export const SEED_REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Maya R.",
    rating: 5,
    flavor: "classic",
    text: "Tastes like the cherry soda of my childhood, minus the sugar crash. The fizz is honestly unreal — cracked one at my desk and the whole room turned around.",
    date: "2 days ago",
  },
  {
    id: "r2",
    name: "Jonas K.",
    rating: 5,
    flavor: "lime",
    text: "Zero Lime is sharp, cold and dangerously drinkable. That little sea-salt sparkle at the end? Whoever formulated this deserves a raise.",
    date: "1 week ago",
  },
  {
    id: "r3",
    name: "Priya S.",
    rating: 5,
    flavor: "classic",
    text: "I've tried every diet soda on the shelf. This is the first one with no weird aftertaste — just clean cherry and a proper bite of carbonation.",
    date: "2 weeks ago",
  },
  {
    id: "r4",
    name: "Leo M.",
    rating: 4,
    flavor: "lime",
    text: "Docking one star only because my 12-pack vanished in a weekend. The can itself is a piece of art — I keep one on my shelf like a trophy.",
    date: "3 weeks ago",
  },
  {
    id: "r5",
    name: "Amara T.",
    rating: 5,
    flavor: "classic",
    text: "Ordered for a dinner party as a joke. Three people asked where to buy it before dessert. The vintage label doesn't hurt either.",
    date: "1 month ago",
  },
];

export const NAV_ITEMS: { id: PanelId | null; label: string }[] = [
  { id: null, label: "Home" },
  { id: "ingredients", label: "Ingredients" },
  { id: "taste", label: "Taste" },
  { id: "eco", label: "Eco" },
  { id: "reviews", label: "Reviews" },
];

export const otherFlavor = (f: FlavorId): FlavorId => (f === "classic" ? "lime" : "classic");
