import { connectDB } from '../db';
import { Category, Event, Inquiry, Product } from '../models';

const IST_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });

/** Start of "today" in India, as a UTC Date. */
function startOfIstDay(d = new Date()) {
  return new Date(`${IST_DAY.format(d)}T00:00:00+05:30`);
}

export async function getStats() {
  await connectDB();
  const today = startOfIstDay();
  const day = 86_400_000;
  const weekStart = new Date(today.getTime() - 6 * day); // rolling 7 days incl. today
  const monthStart = new Date(today.getTime() - 29 * day); // rolling 30 days
  const prevMonthStart = new Date(monthStart.getTime() - 30 * day);

  const [published, draft, categories, total, week, month, prevMonth, fresh, converted, daily, topProducts, recent, whatsappClicks30] = await Promise.all([
    Product.countDocuments({ status: 'published' }),
    Product.countDocuments({ status: 'draft' }),
    Category.countDocuments({ isActive: true }),
    Inquiry.countDocuments({ archived: false }),
    Inquiry.countDocuments({ createdAt: { $gte: weekStart } }),
    Inquiry.countDocuments({ createdAt: { $gte: monthStart } }),
    Inquiry.countDocuments({ createdAt: { $gte: prevMonthStart, $lt: monthStart } }),
    Inquiry.countDocuments({ status: 'new', archived: false }),
    Inquiry.countDocuments({ status: 'converted', createdAt: { $gte: monthStart } }),
    Inquiry.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: monthStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } },
    ]),
    Inquiry.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: monthStart }, productName: { $ne: '' } } },
      { $group: { _id: '$productName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Inquiry.find({ archived: false }).sort({ createdAt: -1 }).limit(6).lean(),
    Event.countDocuments({ type: 'whatsapp_click', createdAt: { $gte: monthStart } }),
  ]);

  // Continuous 30-day axis, zero-filled.
  const byDay = new Map(daily.map((d) => [d._id, d.count]));
  const series = Array.from({ length: 30 }, (_, i) => {
    const key = IST_DAY.format(new Date(monthStart.getTime() + i * day + 12 * 3_600_000));
    return { date: key, count: byDay.get(key) ?? 0 };
  });

  return {
    products: { published, draft, total: published + draft },
    categories,
    inquiries: { total, week, month, prevMonth, new: fresh, convertedMonth: converted },
    whatsappClicks30,
    series,
    topProducts: topProducts.map((t) => ({ name: t._id, count: t.count })),
    recent,
  };
}

export async function recordEvent(data: { type: 'whatsapp_click' | 'call_click'; productSlug: string; path: string }) {
  await connectDB();
  await Event.create(data);
}
