import type { ArtKind, PALETTES } from './art';

type PaletteName = keyof typeof PALETTES;

export const categories = [
  {
    slug: 'wooden-chowki',
    name: 'Wooden Chowki & Bajot',
    tagline: 'Hand-painted chowki, bajot and patla for pooja rooms and décor',
    art: 'chowki' as ArtKind,
    palette: 'ruby' as PaletteName,
    seoTitle: 'Wooden Chowki Manufacturer in Gujarat | Meenakari Bajot & Patla',
    seoDescription:
      'Buy handcrafted Meenakari wooden chowki, pooja bajot and patla direct from the manufacturer in Jasdan, Rajkot. Wholesale & retail, bulk orders welcome.',
    description: `Our wooden chowki, bajot and patla are hand-built from seasoned wood in our Jasdan workshop and finished with traditional Meenakari (enamel) work. Each piece is painted by hand, so no two are exactly alike.

A chowki is the heart of a home mandir: it raises the idol, keeps the pooja space clean and adds colour to festive décor. We make them in sizes from 9 inch to 24 inch, in single pieces or matching sets, and we supply temples, pooja stores and gifting companies across India.

Looking for a custom size, colour or logo for a bulk order? Send us an inquiry with the quantity and we will reply with a quote within one working day.`,
  },
  {
    slug: 'dry-fruit-box',
    name: 'Dry Fruit Boxes',
    tagline: 'Meenakari dry fruit boxes for festive and corporate gifting',
    art: 'dryfruit' as ArtKind,
    palette: 'teal' as PaletteName,
    seoTitle: 'Meenakari Dry Fruit Box Wholesale | Handcrafted Gift Boxes',
    seoDescription:
      'Handcrafted Meenakari dry fruit boxes in 2 to 9 compartments. Wholesale prices for Diwali, wedding and corporate gifting from Kalgi Handicraft, Rajkot.',
    description: `A Meenakari dry fruit box is a gift that stays on the table long after the festival. Ours are made of wood with hand-painted enamel work, a snug-fitting lid and food-safe compartments.

Choose from 2, 3, 4, 6 and 9 compartment designs. We offer wholesale pricing from 25 pieces, custom colours for wedding themes and optional branding for corporate Diwali gifting.`,
  },
  {
    slug: 'pooja-articles',
    name: 'Pooja Articles',
    tagline: 'Thalis, kumkum boxes and diya stands, painted by hand',
    art: 'thali' as ArtKind,
    palette: 'ruby' as PaletteName,
    seoTitle: 'Pooja Articles Online India | Meenakari Pooja Thali & Kumkum Box',
    seoDescription:
      'Meenakari pooja thali sets, kumkum haldi boxes and roli chawal containers, handmade in Gujarat. Order online in bulk or retail from Kalgi Handicraft.',
    description: `From the daily aarti to wedding ceremonies, our pooja articles bring colour and craft to every ritual. Every thali, kumkum box and roli chawal container is hand-painted with Meenakari motifs and finished to last for years.

Pooja stores and temples can buy wholesale at mixed-design MOQs. For return gifts and wedding favours we can pack each piece individually.`,
  },
  {
    slug: 'jewellery-gift-box',
    name: 'Jewellery & Gift Boxes',
    tagline: 'Trinket, bangle and jewellery boxes that are a gift in themselves',
    art: 'jewellery' as ArtKind,
    palette: 'royal' as PaletteName,
    seoTitle: 'Handicraft Jewellery Box Manufacturer Rajkot | Meenakari Gift Boxes',
    seoDescription:
      'Meenakari jewellery boxes, bangle boxes and gift boxes made by hand in Rajkot, Gujarat. Ideal for weddings, return gifts and corporate hampers.',
    description: `Our jewellery and gift boxes are lined, lidded and painted by hand with Meenakari enamel work. Sizes range from small trinket boxes for return gifts to dome-lid chests for bridal jewellery.

Corporate buyers can order them as the base of a gift hamper, with custom colours and an engraved or printed logo plate.`,
  },
];

interface SeedProduct {
  name: string;
  category: string;
  priceFrom: number;
  unit?: string;
  material: string;
  size: string;
  colorOptions: string[];
  moq: number;
  art: ArtKind[];
  palette: PaletteName;
  featured?: boolean;
  description: string;
}

const MEENAKARI_CARE = `Care: wipe with a soft dry cloth. Keep away from water and direct sunlight to preserve the enamel colours.`;

export const products: SeedProduct[] = [
  {
    name: 'Meenakari Wooden Chowki, Ruby Red',
    category: 'wooden-chowki',
    priceFrom: 650,
    material: 'Sheesham wood, Meenakari enamel work',
    size: '12 x 12 x 5 inch',
    colorOptions: ['Ruby Red', 'Emerald Green', 'Royal Blue'],
    moq: 10,
    art: ['chowki', 'detail'],
    palette: 'ruby',
    featured: true,
    description: `A classic square chowki with a hand-painted floral medallion, scalloped apron and turned legs. It is sturdy enough for brass idols and small enough for apartment mandirs.

Painted by our artisans in Jasdan with traditional Meenakari motifs in ruby, emerald and gold.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Pooja Bajot with Meenakari Work, Emerald',
    category: 'wooden-chowki',
    priceFrom: 550,
    material: 'Mango wood, Meenakari enamel work',
    size: '10 x 10 x 4 inch',
    colorOptions: ['Emerald Green', 'Ruby Red'],
    moq: 12,
    art: ['chowki', 'detail'],
    palette: 'emerald',
    featured: true,
    description: `A compact bajot for daily pooja and festive thali placement. The emerald base is hand-painted with a jaal (lattice) of flowers and finished with a clear protective coat.

It is a popular choice for Ganesh Chaturthi and Navratri gifting.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Royal Blue Meenakari Patla, Large',
    category: 'wooden-chowki',
    priceFrom: 1200,
    material: 'Sheesham wood, Meenakari enamel work',
    size: '24 x 16 x 6 inch',
    colorOptions: ['Royal Blue', 'Noir Black'],
    moq: 5,
    art: ['chowki', 'detail'],
    palette: 'royal',
    featured: true,
    description: `A large patla for wedding rituals, griha pravesh and temple use. It is strong enough to sit on, with reinforced joinery and a wide hand-painted top.

It can be made to custom sizes for bulk and temple orders.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Ivory Floral Chowki, Set of 2',
    category: 'wooden-chowki',
    priceFrom: 1450,
    unit: 'per set',
    material: 'Sheesham wood, Meenakari enamel work',
    size: '12 x 12 inch and 9 x 9 inch',
    colorOptions: ['Ivory'],
    moq: 5,
    art: ['chowki', 'detail'],
    palette: 'ivory',
    description: `A nesting pair of chowkis in soft ivory with red, green and blue florals. Use them together to create a tiered mandir, or separately as décor stools.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Designer Mandir Chowki with Diya Stand',
    category: 'wooden-chowki',
    priceFrom: 890,
    material: 'MDF with Meenakari enamel work',
    size: '15 x 12 x 6 inch',
    colorOptions: ['Noir Black', 'Ruby Red'],
    moq: 10,
    art: ['chowki-diya', 'detail'],
    palette: 'noir',
    description: `A black-lacquer chowki with jewel-tone enamel florals. It comes with a matching brass-finish diya, so it is ready to gift for Diwali.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Meenakari Dry Fruit Box, 3 Compartments',
    category: 'dry-fruit-box',
    priceFrom: 480,
    material: 'Wood, Meenakari enamel work, food-safe lacquer inside',
    size: '10 x 4 x 3 inch',
    colorOptions: ['Teal', 'Ruby Red', 'Royal Blue'],
    moq: 25,
    art: ['dryfruit', 'dryfruit-open', 'detail'],
    palette: 'teal',
    featured: true,
    description: `Our best-selling three-compartment dry fruit box has a close-fitting lid, three hand-painted medallions and a food-safe lacquered interior.

It is a favourite for Diwali and corporate gifting, and optional logo branding is available for orders of 100 or more.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Royal Dry Fruit Box, 6 Compartments',
    category: 'dry-fruit-box',
    priceFrom: 780,
    material: 'Wood, Meenakari enamel work, food-safe lacquer inside',
    size: '12 x 8 x 3 inch',
    colorOptions: ['Royal Blue', 'Emerald Green'],
    moq: 25,
    art: ['dryfruit', 'dryfruit-open', 'detail'],
    palette: 'royal',
    featured: true,
    description: `Six generous compartments for almonds, cashews, pistachios and more. The royal blue enamel with gold borders makes this our most-requested box for wedding hampers.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Wedding Gift Dry Fruit Box, Ruby',
    category: 'dry-fruit-box',
    priceFrom: 950,
    material: 'Sheesham wood, Meenakari enamel work',
    size: '14 x 9 x 4 inch',
    colorOptions: ['Ruby Red', 'Ivory'],
    moq: 20,
    art: ['dryfruit', 'dryfruit-open', 'detail'],
    palette: 'ruby',
    description: `A premium dry fruit box for shagun and wedding gifting, painted in auspicious ruby red. Custom name plates for the bride and groom are available.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Saffron Mini Dry Fruit Box',
    category: 'dry-fruit-box',
    priceFrom: 320,
    material: 'Wood, Meenakari enamel work',
    size: '7 x 4 x 3 inch',
    colorOptions: ['Saffron', 'Teal'],
    moq: 50,
    art: ['dryfruit', 'dryfruit-open', 'detail'],
    palette: 'saffron',
    description: `A two-compartment mini box that works well for return gifts, puja prasad and event favours. It is light, colourful and budget-friendly for large quantities.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Meenakari Pooja Thali Set',
    category: 'pooja-articles',
    priceFrom: 750,
    unit: 'per set',
    material: 'Wood base, Meenakari enamel, brass-finish diya',
    size: '12 inch diameter',
    colorOptions: ['Ruby Red', 'Royal Blue', 'Emerald Green'],
    moq: 10,
    art: ['thali', 'detail'],
    palette: 'ruby',
    featured: true,
    description: `A complete pooja thali set with a hand-painted rim, diya, kumkum and haldi bowls and a rice katori. It is ready for aarti, Karwa Chauth and wedding rituals.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Kumkum Haldi Box, 3 Containers',
    category: 'pooja-articles',
    priceFrom: 280,
    material: 'Wood, Meenakari enamel work',
    size: '9 x 3 x 3 inch',
    colorOptions: ['Emerald Green', 'Ruby Red'],
    moq: 25,
    art: ['kumkum', 'detail'],
    palette: 'emerald',
    featured: true,
    description: `Three lidded containers for kumkum, haldi and chandan on a matching painted tray. It is a staple for pooja stores and a popular return gift.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Designer Pooja Thali, Royal Blue',
    category: 'pooja-articles',
    priceFrom: 690,
    material: 'Wood base, Meenakari enamel',
    size: '11 inch diameter',
    colorOptions: ['Royal Blue'],
    moq: 10,
    art: ['thali', 'detail'],
    palette: 'royal',
    description: `A royal blue thali with a ring of hand-painted florals and a gold-leaf centre. It is a statement piece for festive pooja and gifting.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Roli Chawal Box',
    category: 'pooja-articles',
    priceFrom: 240,
    material: 'Wood, Meenakari enamel work',
    size: '8 x 3 x 3 inch',
    colorOptions: ['Saffron', 'Ruby Red'],
    moq: 50,
    art: ['kumkum', 'detail'],
    palette: 'saffron',
    description: `A compact roli chawal box in bright saffron, sized for tilak ceremonies, rakhi thalis and wedding favours.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Meenakari Jewellery Box with Dome Lid',
    category: 'jewellery-gift-box',
    priceFrom: 850,
    material: 'Sheesham wood, Meenakari enamel, velvet lining',
    size: '8 x 6 x 6 inch',
    colorOptions: ['Ruby Red', 'Royal Blue', 'Emerald Green'],
    moq: 10,
    art: ['jewellery', 'detail'],
    palette: 'ruby',
    featured: true,
    description: `A dome-lid jewellery chest with a velvet-lined interior, brass-finish clasp and handle, and a hand-painted medallion on the front.

It makes a heirloom-style gift for brides and anniversaries.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Ivory Bangle & Jewellery Box',
    category: 'jewellery-gift-box',
    priceFrom: 620,
    material: 'Wood, Meenakari enamel, velvet lining',
    size: '9 x 5 x 5 inch',
    colorOptions: ['Ivory', 'Ruby Red'],
    moq: 10,
    art: ['jewellery', 'detail'],
    palette: 'ivory',
    description: `A soft ivory box with twin bangle rods inside and floral enamel work outside, for weddings and trousseau packing.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Corporate Meenakari Gift Box',
    category: 'jewellery-gift-box',
    priceFrom: 560,
    material: 'MDF, Meenakari enamel work',
    size: '10 x 8 x 2 inch',
    colorOptions: ['Noir Black', 'Royal Blue'],
    moq: 50,
    art: ['giftbox', 'detail'],
    palette: 'noir',
    featured: true,
    description: `A slim, flat gift box in black lacquer with jewel-tone enamel work, used as the base for corporate hampers. The lid can carry a logo plate.

We ship pan-India for bulk orders.

${MEENAKARI_CARE}`,
  },
  {
    name: 'Teal Trinket Box',
    category: 'jewellery-gift-box',
    priceFrom: 390,
    material: 'Wood, Meenakari enamel work',
    size: '6 x 6 x 2 inch',
    colorOptions: ['Teal', 'Saffron'],
    moq: 25,
    art: ['giftbox', 'detail'],
    palette: 'teal',
    description: `A small square trinket box for rings, earrings and keepsakes. It is a colourful, affordable return gift for weddings and events.

${MEENAKARI_CARE}`,
  },
];

export const settings = {
  businessName: 'Kalgi Handicraft',
  tagline: 'Meenakari woodcraft manufacturer in Jasdan, Gujarat',
  ownerName: 'Akshay B Hirani',
  // From the business card.
  phone: '+91 84698 85085',
  whatsapp: '918469885085',
  email: 'axayp9932@gmail.com',
  addressLine: 'Aanand Nagar, Nr. New Bus Stop',
  city: 'Jasdan, Dist. Rajkot',
  state: 'Gujarat',
  postalCode: '360050',
  country: 'IN',
  // Verified on the IndiaMART profile (GST registered 2021).
  gstNumber: '24AXNPH4757R1ZN',
  establishedYear: 1999,
  rating: 4.5,
  ratingCount: 10,
  ratingSource: 'IndiaMART',
  ratingUrl: 'https://www.indiamart.com/kalgi-handicraft/testimonial.html',
  mapEmbedUrl: 'https://www.google.com/maps?q=Aanand+Nagar+New+Bus+Stop+Jasdan+Rajkot+Gujarat+360050&output=embed',
  hours: [{ days: 'Monday – Sunday (open all days)', hours: '8:00 AM – 8:30 PM' }],
  // Only real reviews, added in Admin → Business details.
  testimonials: [],
  social: { instagram: '', facebook: '', youtube: '', indiamart: 'https://www.indiamart.com/kalgi-handicraft/' },
};

export const blogPosts = [
  {
    title: 'What Is Meenakari Work? A Short Guide to the Enamel Craft',
    slug: 'what-is-meenakari-work',
    category: 'wooden-chowki',
    excerpt:
      'Meenakari is the art of decorating a surface with bright enamel colours. Here is where it comes from, how it is done on wood, and how to tell good work from bad.',
    content: `<p>Meenakari comes from the Persian word <em>mina</em>, meaning the colour of heaven. It began as the art of fusing coloured enamel onto metal, and over the centuries the same jewel-tone palette of ruby red, emerald green, royal blue and gold has been adapted to wood, giving us the Meenakari handicrafts made in Gujarat today.</p>
<h2>How Meenakari work is done on wood</h2>
<p>Wooden Meenakari is built up in layers. The piece is first shaped, sanded and primed. Our artisans then paint the base colour, draw the floral outlines by hand and fill each petal and leaf with enamel paint. A final protective coat gives the characteristic glassy shine.</p>
<ol><li><strong>Base coat.</strong> A solid enamel colour sets the mood of the piece.</li><li><strong>Outline.</strong> Gold or white lines mark out the flowers, vines and borders.</li><li><strong>Filling.</strong> Each petal is filled in by hand, one colour at a time.</li><li><strong>Finishing.</strong> A clear coat protects the colours from wear.</li></ol>
<h2>How to judge the quality of Meenakari work</h2>
<ul><li>Lines should be crisp, with no bleeding between colours.</li><li>The motif should wrap cleanly around edges and corners.</li><li>The wood should be seasoned and heavy for its size, not hollow.</li></ul>
<p>Every chowki, box and thali we make in Jasdan is painted this way, by hand, which is why no two pieces are exactly alike.</p>`,
  },
  {
    title: 'How to Choose the Right Wooden Chowki for Your Pooja Room',
    slug: 'how-to-choose-wooden-chowki-for-pooja',
    category: 'wooden-chowki',
    excerpt:
      'Size, height, wood and finish all matter when choosing a chowki for your home mandir. Here is a simple checklist before you buy.',
    content: `<p>A chowki (also called a bajot or patla) raises your idols above the floor and marks out the pooja space. Choosing the right one comes down to four things.</p>
<h2>1. Size</h2>
<p>Measure the space in your mandir. A 12 x 12 inch chowki suits most apartment mandirs, while 18 to 24 inch patlas suit larger idols and ceremonies.</p>
<h2>2. Height</h2>
<p>Low chowkis of 4 to 5 inches work well on shelves. Taller ones of 6 inches or more stand directly on the floor.</p>
<h2>3. Wood</h2>
<p>Sheesham and mango wood are durable and heavy enough for brass idols. MDF is lighter and more affordable for décor and gifting.</p>
<h2>4. Finish</h2>
<p>Meenakari work adds colour and lasts for years with simple care: wipe with a dry cloth and keep away from water.</p>
<p>Browse our range of chowkis, from single pieces to matching sets, or send us your measurements for a custom size.</p>`,
  },
  {
    title: 'Dry Fruit Boxes for Corporate Diwali Gifting: A Bulk Buyer’s Guide',
    slug: 'dry-fruit-box-corporate-diwali-gifting',
    category: 'dry-fruit-box',
    excerpt:
      'Planning Diwali gifts for employees or clients? Here is how to pick a Meenakari dry fruit box, plan quantities and brand it with your logo.',
    content: `<p>A handcrafted dry fruit box keeps getting used long after the sweets are finished, which is why it is one of the most popular corporate Diwali gifts in India.</p>
<h2>Pick the right compartment count</h2>
<p>Three-compartment boxes are a cost-effective choice for large teams. Six and nine-compartment boxes suit senior clients and partners.</p>
<h2>Plan quantities and timelines</h2>
<p>For orders above 200 pieces, we recommend confirming at least 4 to 6 weeks before Diwali. Every piece is hand-painted, so capacity is limited in peak season.</p>
<h2>Branding options</h2>
<ul><li>Logo plate on the lid (from 100 pieces)</li><li>Custom colours to match your brand</li><li>Individual gift packing with a message card</li></ul>
<p>Send us your quantity and budget through the inquiry form and we will share a quote with photos of sample designs.</p>`,
  },
];
