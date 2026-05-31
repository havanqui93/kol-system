const BASE_VI_TAGS = ["#viral", "#trending", "#review", "#sanpham", "#muasam"];

const PLATFORM_TAGS: Record<string, string[]> = {
  tiktok: ["#tiktokshop", "#tiktokreviews", "#fyp", "#foryou", "#xuhuong"],
  facebook: ["#facebookreels", "#reels", "#reviewsanpham", "#muabannhanh"],
  instagram: ["#instareels", "#reelsviral", "#reviewig", "#instashop"],
  youtube_shorts: ["#shorts", "#youtubeshorts", "#reviewvideo", "#sanphamhot"],
};

const CATEGORY_TAGS: Record<string, string[]> = {
  beauty: ["#lamdep", "#skincare", "#makeup", "#beauty"],
  fashion: ["#thoitrang", "#fashion", "#style", "#outfit"],
  food: ["#amthuc", "#food", "#foodreview", "#anngon"],
  tech: ["#congnghe", "#tech", "#gadget", "#review"],
  health: ["#suckhoe", "#health", "#wellness", "#vitamin"],
  home: ["#noithat", "#home", "#decor", "#homedecor"],
  car: ["#xecu", "#mua_xe", "#car", "#oto"],
};

export function suggestHashtags(opts: {
  platform: string;
  videoType: string;
  category?: string;
  productName?: string;
  maxTags?: number;
}): string[] {
  const { platform, videoType, category, maxTags = 20 } = opts;

  const tags = new Set<string>();

  // Add platform-specific tags
  const platformTags = PLATFORM_TAGS[platform] ?? [];
  platformTags.forEach((t) => tags.add(t));

  // Add base Vietnamese tags
  BASE_VI_TAGS.forEach((t) => tags.add(t));

  // Add category tags if known
  if (category) {
    const catTags = CATEGORY_TAGS[category.toLowerCase()] ?? [];
    catTags.forEach((t) => tags.add(t));
  }

  // Add video type specific tags
  if (videoType === "used_car") CATEGORY_TAGS.car.forEach((t) => tags.add(t));
  if (videoType === "affiliate") tags.add("#affiliate");
  if (videoType === "product_review") tags.add("#unboxing");

  return Array.from(tags).slice(0, maxTags);
}
