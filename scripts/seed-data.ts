/**
 * Datos de ejemplo: 12 locales INVENTADOS de la zona norte de Montería
 * (coordenadas aproximadas). El admin puede editarlos o reemplazarlos.
 */
type Day = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";
type Hours = { open: string; close: string } | null;

/** Crea el horario de la semana: los días indicados abren de `open` a `close`. */
function hours(days: Day[], open: string, close: string): Record<Day, Hours> {
  const all: Day[] = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
  return Object.fromEntries(all.map((d) => [d, days.includes(d) ? { open, close } : null])) as Record<Day, Hours>;
}

const JUE_SAB: Day[] = ["jue", "vie", "sab"];
const VIE_SAB: Day[] = ["vie", "sab"];

export interface SeedVenue {
  id: string;
  name: string;
  type: "bar" | "discoteca" | "rooftop" | "lounge";
  genres: string[];
  lat: number;
  lng: number;
  address: string;
  coverPrice: number;
  drinkPriceFrom: number;
  schedule: Record<Day, Hours>;
  description: string;
  ambience: string;
  dressCode: string;
  verified: boolean;
  /** 1 a 3: qué tan lleno suele estar (lo usa el modo demo). */
  popularity: 1 | 2 | 3;
  promos: { title: string; detail: string }[];
  reviews: { author: string; rating: number; comment: string; verifiedVisit: boolean }[];
}

export const seedVenues: SeedVenue[] = [
  {
    id: "neon41", name: "Neón 41", type: "discoteca", genres: ["Reggaetón"], lat: 8.7838, lng: -75.8689,
    address: "Calle 41 con Circunvalar", coverPrice: 20000, drinkPriceFrom: 15000, schedule: hours(JUE_SAB, "21:00", "03:00"),
    description: "La discoteca más prendida del norte: luces neón, DJ residente y pista grande.",
    ambience: "Joven, universitario, mucha energía", dressCode: "Casual elegante", verified: true, popularity: 3,
    promos: [{ title: "2x1 en cócteles antes de las 11 p. m.", detail: "Aplica para mojito, piña colada y margarita." }],
    reviews: [
      { author: "Valentina", rating: 5, comment: "El mejor DJ de Montería, la pista siempre llena.", verifiedVisit: true },
      { author: "Andrés", rating: 4, comment: "Muy bueno, pero a la 1 a. m. ya no cabe un alma.", verifiedVisit: true },
    ],
  },
  {
    id: "corralvallenato", name: "El Corral Vallenato", type: "bar", genres: ["Vallenato"], lat: 8.7812, lng: -75.8661,
    address: "Carrera 6 # 45-20", coverPrice: 0, drinkPriceFrom: 9000,
    schedule: hours(["mie", "jue", "vie", "sab", "dom"], "18:00", "02:00"),
    description: "Parranda vallenata en vivo con acordeón y caja todos los fines de semana.",
    ambience: "Familiar y parrandero, todas las edades", dressCode: "Casual", verified: true, popularity: 2,
    promos: [{ title: "Cubeta de 6 cervezas a $36.000", detail: "Todo el día." }],
    reviews: [{ author: "Carlos", rating: 5, comment: "La parranda del viernes es lo máximo.", verifiedVisit: true }],
  },
  {
    id: "kalor", name: "Kalor Champeta Bar", type: "bar", genres: ["Champeta"], lat: 8.7858, lng: -75.8712,
    address: "Calle 44 # 8-15", coverPrice: 10000, drinkPriceFrom: 10000, schedule: hours(VIE_SAB, "20:00", "03:00"),
    description: "Picó, champeta y terraza al aire libre.", ambience: "Bailador, mucha gozadera", dressCode: "Casual",
    verified: true, popularity: 2, promos: [],
    reviews: [{ author: "Mafe", rating: 4, comment: "Buena música, el sonido está brutal.", verifiedVisit: false }],
  },
  {
    id: "altura", name: "Altura Rooftop", type: "rooftop", genres: ["Crossover"], lat: 8.7795, lng: -75.873,
    address: "Avenida Primera, piso 8", coverPrice: 30000, drinkPriceFrom: 22000, schedule: hours(JUE_SAB, "19:00", "02:00"),
    description: "Terraza con vista a la Ronda del Sinú y coctelería de autor.",
    ambience: "Tranquilo y elegante, ideal para conversar", dressCode: "Elegante", verified: true, popularity: 1,
    promos: [{ title: "Happy hour de 7 a 9 p. m.", detail: "30 % de descuento en coctelería de la casa." }],
    reviews: [
      { author: "Sebastián", rating: 5, comment: "La vista al río de noche es otra cosa.", verifiedVisit: true },
      { author: "Laura", rating: 3, comment: "Bonito pero caro.", verifiedVisit: false },
    ],
  },
  {
    id: "laclave", name: "Salsoteca La Clave", type: "bar", genres: ["Salsa"], lat: 8.7769, lng: -75.8684,
    address: "Calle 36 # 4-50", coverPrice: 10000, drinkPriceFrom: 11000, schedule: hours(JUE_SAB, "20:00", "02:00"),
    description: "Salsa brava y clases gratis los jueves a las 8 p. m.", ambience: "Bailarines de todas las edades",
    dressCode: "Casual", verified: true, popularity: 2,
    promos: [{ title: "Clase de salsa gratis los jueves", detail: "De 8 a 9 p. m., sin reserva." }],
    reviews: [{ author: "Don Jaime", rating: 5, comment: "Aquí se baila salsa de verdad.", verifiedVisit: true }],
  },
  {
    id: "distritonorte", name: "Distrito Norte", type: "discoteca", genres: ["Crossover", "Reggaetón"], lat: 8.7881, lng: -75.8676,
    address: "Circunvalar # 50-10", coverPrice: 25000, drinkPriceFrom: 16000, schedule: hours(VIE_SAB, "22:00", "04:00"),
    description: "Dos ambientes: crossover en la principal y reggaetón en la terraza.", ambience: "Mixto, 20 a 35 años",
    dressCode: "Casual elegante", verified: true, popularity: 3,
    promos: [{ title: "Mesa VIP con botella", detail: "Reserva por WhatsApp y te esperan en la puerta." }],
    reviews: [{ author: "Juliana", rating: 4, comment: "Muy buen ambiente, la fila es larga después de las 12.", verifiedVisit: true }],
  },
  {
    id: "lunaroja", name: "Luna Roja", type: "bar", genres: ["Reggaetón"], lat: 8.7826, lng: -75.8741,
    address: "Carrera 2 # 42-30", coverPrice: 0, drinkPriceFrom: 12000,
    schedule: hours(["mie", "jue", "vie", "sab"], "19:00", "02:00"),
    description: "Bar pequeño para calentar motores antes de la discoteca.", ambience: "Parches de amigos, precoteo",
    dressCode: "Casual", verified: true, popularity: 2,
    promos: [{ title: "Shots a $5.000 los miércoles", detail: "Aguardiente, tequila o ron." }], reviews: [],
  },
  {
    id: "parrandero", name: "Café Parrandero", type: "bar", genres: ["Vallenato"], lat: 8.7752, lng: -75.8712,
    address: "Calle 32 con Avenida Primera", coverPrice: 0, drinkPriceFrom: 8000,
    schedule: hours(["lun", "mar", "mie", "jue", "vie", "sab", "dom"], "17:00", "01:00"),
    description: "Cerveza fría, vallenato clásico y mesas afuera.", ambience: "Relajado, de conversa", dressCode: "Casual",
    verified: true, popularity: 1, promos: [],
    reviews: [{ author: "Pedro", rating: 4, comment: "Barato y con buena música vieja.", verifiedVisit: false }],
  },
  {
    id: "pulso", name: "Pulso Electro Club", type: "discoteca", genres: ["Electrónica"], lat: 8.7899, lng: -75.8714,
    address: "Calle 52 # 9-40", coverPrice: 35000, drinkPriceFrom: 18000, schedule: hours(["sab"], "22:00", "05:00"),
    description: "House y techno con DJs invitados cada mes.", ambience: "Alternativo, amantes de la electrónica",
    dressCode: "Libre", verified: true, popularity: 1,
    promos: [{ title: "Cover gratis antes de las 11 p. m.", detail: "Mostrando la app en la puerta." }],
    reviews: [{ author: "Nico", rating: 5, comment: "Por fin electrónica buena en Montería.", verifiedVisit: true }],
  },
  {
    id: "barriobar", name: "Barrio Bar", type: "bar", genres: ["Champeta"], lat: 8.7787, lng: -75.8655,
    address: "Carrera 7 # 38-12", coverPrice: 0, drinkPriceFrom: 9000, schedule: hours(JUE_SAB, "19:00", "02:00"),
    description: "Esquinero, con picó y mucha champeta africana.", ambience: "Popular y bailador", dressCode: "Casual",
    verified: false, popularity: 2, promos: [], reviews: [],
  },
  {
    id: "caracola", name: "Caracola Lounge", type: "lounge", genres: ["Crossover"], lat: 8.7864, lng: -75.8748,
    address: "Avenida Primera # 47-05", coverPrice: 15000, drinkPriceFrom: 17000, schedule: hours(JUE_SAB, "19:00", "02:00"),
    description: "Lounge con sofás, shishas y música suave al principio de la noche.", ambience: "Tranquilo, para grupos",
    dressCode: "Casual elegante", verified: true, popularity: 1,
    promos: [{ title: "Botella + mezcladores con 15 % off", detail: "Reservando mesa para 6 o más." }],
    reviews: [{ author: "Camila", rating: 4, comment: "Rico para empezar la noche.", verifiedVisit: true }],
  },
  {
    id: "tumbao", name: "Tumbao Club", type: "discoteca", genres: ["Salsa"], lat: 8.7845, lng: -75.8634,
    address: "Carrera 9 # 46-60", coverPrice: 15000, drinkPriceFrom: 13000, schedule: hours(VIE_SAB, "21:00", "03:00"),
    description: "Salsa, merengue y bachata con orquesta en vivo los sábados.", ambience: "Adultos, 25 años en adelante",
    dressCode: "Casual elegante", verified: true, popularity: 2,
    promos: [{ title: "Orquesta en vivo este sábado", detail: "Desde las 11 p. m." }],
    reviews: [{ author: "Rosa", rating: 5, comment: "La orquesta de los sábados es espectacular.", verifiedVisit: true }],
  },
];
