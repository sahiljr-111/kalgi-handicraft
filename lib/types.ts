export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface CategoryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface Category extends CategoryRef {
  tagline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  noindex?: boolean;
  image: string;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  category: CategoryRef;
  priceFrom: number;
  unit: string;
  material: string;
  size: string;
  colorOptions: string[];
  moq: number;
  images: ProductImage[];
  description: string;
  seoTitle: string;
  seoDescription: string;
  noindex?: boolean;
  isFeatured: boolean;
  showInHero?: boolean;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends Product {
  related: Product[];
}

export type InquiryStatus = 'new' | 'contacted' | 'converted' | 'closed';

export interface Inquiry {
  _id: string;
  name: string;
  phone: string;
  email: string;
  productId: string | null | { _id: string; name: string; slug: string; images: ProductImage[]; priceFrom: number };
  productName: string;
  quantity: number | null;
  message: string;
  source: 'form' | 'whatsapp';
  status: InquiryStatus;
  notes: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  featuredImage: string;
  featuredImageAlt?: string;
  topic?: string;
  tags?: string[];
  relatedCategory: CategoryRef | string | null;
  author: string;
  seoTitle: string;
  seoDescription: string;
  ogImage?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  status: 'draft' | 'published';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostDetail extends BlogPost {
  related: BlogPost[];
}

export interface BlogTopic {
  name: string;
  slug: string;
  count: number;
}

export interface GalleryItem {
  _id: string;
  title: string;
  caption: string;
  image: string;
  category: CategoryRef | null;
  sortOrder: number;
}

export interface Media {
  _id: string;
  url: string;
  filename: string;
  provider: 'cloudinary' | 'local';
  bytes: number;
  format: string;
  createdAt: string;
}

export interface Testimonial {
  name: string;
  location: string;
  quote: string;
  rating: number;
}

export interface Settings {
  businessName: string;
  tagline: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstNumber: string;
  establishedYear: number;
  rating: number;
  ratingCount: number;
  ratingSource?: string;
  ratingUrl?: string;
  mapEmbedUrl: string;
  heroImage: string;
  aboutImage: string;
  hours: { days: string; hours: string }[];
  testimonials: Testimonial[];
  social: { instagram: string; facebook: string; youtube: string; indiamart: string };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'staff';
}
