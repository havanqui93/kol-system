export const BASE_VI_TAGS = ["#viral", "#trending", "#review", "#sanpham", "#muasam"];

export const PLATFORM_TAGS: Record<string, string[]> = {
  tiktok: ["#tiktokshop", "#tiktokreviews", "#fyp", "#foryou", "#xuhuong"],
  facebook: ["#facebookreels", "#reels", "#reviewsanpham", "#muabannhanh"],
  instagram: ["#instareels", "#reelsviral", "#reviewig", "#instashop"],
  youtube_shorts: ["#shorts", "#youtubeshorts", "#reviewvideo", "#sanphamhot"],
};

export const CATEGORY_TAGS: Record<string, string[]> = {
  beauty: ["#lamdep", "#skincare", "#makeup", "#beauty"],
  fashion: ["#thoitrang", "#fashion", "#style", "#outfit"],
  food: ["#amthuc", "#food", "#foodreview", "#anngon"],
  tech: ["#congnghe", "#tech", "#gadget", "#review"],
  health: ["#suckhoe", "#health", "#wellness", "#vitamin"],
  home: ["#noithat", "#home", "#decor", "#homedecor"],
  car: ["#xecu", "#mua_xe", "#car", "#oto"],
};

// Extended category tags
const EXTENDED_CATEGORY_TAGS: Record<string, string[]> = {
  ...CATEGORY_TAGS,
  sport: ["#thethao", "#sport", "#fitness", "#workout"],
  baby: ["#babyproducts", "#congnguoi", "#trenso", "#nuoicon"],
  pet: ["#thucung", "#pet", "#dog", "#cat", "#cun", "#meo"],
  education: ["#hoctruc", "#education", "#kienhoc", "#hoctap"],
  finance: ["#taichinh", "#tiengiam", "#dautu", "#tieukhon"],
  travel: ["#dulich", "#travel", "#khampha", "#vietnam"],
  food_delivery: ["#delivery", "#goimon", "#thucpham", "#fooddelivery"],
};

// Trending Vietnamese hashtags by season/event
export const TRENDING_SEASONAL_TAGS: Record<string, string[]> = {
  tet: ["#tet2025", "#chucmungnammoi", "#tetnguyen", "#hangtet"],
  summer: ["#muahe", "#sale2025", "#giamdoc", "#summer"],
  back_to_school: ["#batdautruong", "#backtoschool", "#muasam2025", "#truocnamhoc"],
  black_friday: ["#blackfriday", "#sieugiamgia", "#muamua", "#salecuonam"],
};

export function suggestHashtags(opts: {
  platform: string;
  videoType: string;
  category?: string;
  productName?: string;
  maxTags?: number;
  seasonal?: keyof typeof TRENDING_SEASONAL_TAGS;
}): string[] {
  const { platform, videoType, category, maxTags = 20, seasonal } = opts;

  const tags = new Set<string>();

  // Add platform-specific tags
  const platformTags = PLATFORM_TAGS[platform] ?? [];
  platformTags.forEach((t) => tags.add(t));

  // Add base Vietnamese tags
  BASE_VI_TAGS.forEach((t) => tags.add(t));

  // Add category tags if known
  if (category) {
    const catTags = EXTENDED_CATEGORY_TAGS[category.toLowerCase()] ?? [];
    catTags.forEach((t) => tags.add(t));
  }

  // Add video type specific tags
  if (videoType === "used_car") CATEGORY_TAGS.car.forEach((t) => tags.add(t));
  if (videoType === "affiliate") tags.add("#affiliate");
  if (videoType === "product_review") tags.add("#unboxing");
  if (videoType === "virtual_kol") tags.add("#aivideo");

  // Add seasonal tags
  if (seasonal) {
    (TRENDING_SEASONAL_TAGS[seasonal] ?? []).forEach((t) => tags.add(t));
  }

  return Array.from(tags).slice(0, maxTags);
}

// Count total available tags for a platform
export function countAvailableTags(platform: string): number {
  const base = BASE_VI_TAGS.length;
  const plat = (PLATFORM_TAGS[platform] ?? []).length;
  const cats = Object.values(EXTENDED_CATEGORY_TAGS).flat().length;
  return base + plat + cats;
}
