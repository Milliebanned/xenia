// Photo manifest for the Xenia site. All photos are from Unsplash under the
// Unsplash License (free commercial use, no permission required). Attribution
// is not legally required but is kept here and in docs/imagery.md.

export type XeniaImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  credit: string;
  sourceUrl: string;
};

export const IMAGES = {
  hero: {
    src: '/images/xenia/hero-handover.jpg',
    alt: 'A hand holding a blank white card up to a card reader on a bright orange counter.',
    width: 1600,
    height: 1200,
    credit: 'Photo by Towfiqu barbhuiya on Unsplash',
    sourceUrl: 'https://unsplash.com/photos/person-using-credit-card-payment-terminal-HNPrWOH2Z8U',
  },
  barber: {
    src: '/images/xenia/barber.jpg',
    alt: 'A red, white and blue barber pole glowing against a weathered ochre wall.',
    width: 1200,
    height: 1500,
    credit: 'Photo by Nick Fewings on Unsplash',
    sourceUrl: 'https://unsplash.com/photos/white-red-and-blue-metal-post-VfWpvJAshN0',
  },
  garage: {
    src: '/images/xenia/garage.jpg',
    alt: 'A mechanic’s oil-stained hands working a spanner inside a bright orange engine bay.',
    width: 1200,
    height: 1500,
    credit: 'Photo by Nina Mercado on Unsplash',
    sourceUrl: 'https://unsplash.com/photos/person-holding-red-metal-frame-Y_t0n-T4H5M',
  },
  pharmacy: {
    src: '/images/xenia/pharmacy.jpg',
    alt: 'Pastel tablets spilling from an orange pill bottle onto a sky-blue surface.',
    width: 1200,
    height: 1500,
    credit: 'Photo by Towfiqu barbhuiya on Unsplash',
    sourceUrl: 'https://unsplash.com/photos/colorful-pills-spilling-from-orange-bottle-w8p9cQDLX7I',
  },
  tailor: {
    src: '/images/xenia/tailor.jpg',
    alt: 'Strings of thread spools in pink, orange, olive and blue hanging side by side.',
    width: 1200,
    height: 1500,
    credit: 'Photo by Jacques Dillies on Unsplash',
    sourceUrl: 'https://unsplash.com/photos/a-colorful-assortment-of-thread-spools-arranged-vertically-BOvb1Y7o-5M',
  },
  cornerShop: {
    src: '/images/xenia/corner-shop.jpg',
    alt: 'Rows of oranges, pomegranates and mangoes stacked on a shop’s fruit display.',
    width: 1200,
    height: 1500,
    credit: 'Photo by Megan Bucknall on Unsplash',
    sourceUrl: 'https://unsplash.com/photos/fruits-on-rack-T0d_OmJ85VI',
  },
  gym: {
    src: '/images/xenia/gym.jpg',
    alt: 'A pair of black and hot-pink hex dumbbells crossed on a bright blue background.',
    width: 1200,
    height: 1500,
    credit: 'Photo by Ray Shrewsberry on Unsplash',
    sourceUrl: 'https://unsplash.com/photos/a-pair-of-pink-and-black-dumbs-on-a-blue-background-_78EPmWxz5A',
  },
  florist: {
    src: '/images/xenia/florist.jpg',
    alt: 'A florist’s display packed with pink peonies, red roses, lilac wax flower and cream roses.',
    width: 1200,
    height: 1500,
    credit: 'Photo by Vlada Malina on Unsplash',
    sourceUrl: 'https://unsplash.com/photos/assorted-colored-rose-lot-DPiWUyqyUNE',
  },
} as const satisfies Record<string, XeniaImage>;

export type ImageKey = keyof typeof IMAGES;
