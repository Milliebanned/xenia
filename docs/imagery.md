# Imagery

All site photos live in `public/images/xenia/`. The manifest the site uses is `src/lib/images.ts`, which exports `IMAGES`.

Every photo comes from Unsplash and is covered by the **Unsplash License** (https://unsplash.com/license). The licence allows free use, including commercial use, without asking permission or paying, and attribution is not required. We credit the photographers anyway. None of the photos is from Unsplash+.

The photos were downloaded on 2026-11-05 from the `images.unsplash.com` CDN. They were then cropped and resized with Pillow. No colour filters were applied. Every file was viewed after processing and checked for faces in focus, logos, readable signage and watermarks.

| File | Size | Scene | Photographer | Source page | Licence | Downloaded |
|---|---|---|---|---|---|---|
| hero-handover.jpg | 1600x1200 | Hand holding a blank card at a reader on an orange counter | Towfiqu barbhuiya | https://unsplash.com/photos/person-using-credit-card-payment-terminal-HNPrWOH2Z8U | Unsplash License | 2026-11-05 |
| barber.jpg | 1200x1500 | Barber pole on an ochre wall | Nick Fewings | https://unsplash.com/photos/white-red-and-blue-metal-post-VfWpvJAshN0 | Unsplash License | 2026-11-05 |
| garage.jpg | 1200x1500 | Mechanic's hands with a spanner in an orange engine bay | Nina Mercado | https://unsplash.com/photos/person-holding-red-metal-frame-Y_t0n-T4H5M | Unsplash License | 2026-11-05 |
| pharmacy.jpg | 1200x1500 | Tablets spilling from an orange bottle on sky blue | Towfiqu barbhuiya | https://unsplash.com/photos/colorful-pills-spilling-from-orange-bottle-w8p9cQDLX7I | Unsplash License | 2026-11-05 |
| tailor.jpg | 1200x1500 | Hanging strings of coloured thread spools | Jacques Dillies | https://unsplash.com/photos/a-colorful-assortment-of-thread-spools-arranged-vertically-BOvb1Y7o-5M | Unsplash License | 2026-11-05 |
| corner-shop.jpg | 1200x1500 | Oranges, pomegranates and mangoes on a shop display | Megan Bucknall | https://unsplash.com/photos/fruits-on-rack-T0d_OmJ85VI | Unsplash License | 2026-11-05 |
| gym.jpg | 1200x1500 | Pink and black hex dumbbells on blue | Ray Shrewsberry | https://unsplash.com/photos/a-pair-of-pink-and-black-dumbs-on-a-blue-background-_78EPmWxz5A | Unsplash License | 2026-11-05 |
| florist.jpg | 1200x1500 | Peonies, roses and wax flower at a florist | Vlada Malina | https://unsplash.com/photos/assorted-colored-rose-lot-DPiWUyqyUNE | Unsplash License | 2026-11-05 |

## Notes

- `barber.jpg` shows a carved house number ("10") on the wall next to the pole. It is a numeral, not shop branding.
- `corner-shop.jpg` is a crop of the lower part of the original. The price signs at the top of the original are left out, and the price strip on the shelf edge is out of focus.
- If you replace a photo, use only Unsplash (free licence, not Unsplash+), Pexels or Pixabay. Then update this table and `src/lib/images.ts`.
