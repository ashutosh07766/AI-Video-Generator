import { buildFallbackPlan } from "./pipeline/plan";
import { ReelInput, ReelPlan, TEMPLATES } from "./templates";

// Sample reels used on the landing page. picsum gives stable demo photos.
const photo = (seed: string) => `https://picsum.photos/seed/${seed}/1080/1920`;

const SAMPLES: Record<string, Omit<ReelInput, "templateId" | "lang">> = {
  "festive-offer": {
    businessName: "Sharma Sweets",
    offer: "Flat 25% off on all sweets this Diwali!|Fresh kaju katli & laddoo daily",
    cta: "Order on WhatsApp",
    photos: [photo("sweets1"), photo("mithai2")],
    brandColor: "#f4452a",
  },
  "special-discount": {
    businessName: "Trendy Threads",
    offer: "Mega Sale — Buy 1 Get 1 Free!|On the entire summer collection",
    cta: "Visit our store today",
    photos: [photo("fashion3"), photo("clothing4")],
    brandColor: "#e02f17",
  },
  "new-arrival": {
    businessName: "Glow Salon",
    offer: "New monsoon hair-spa is here|Pamper yourself this season",
    cta: "Book your slot now",
    photos: [photo("salon5"), photo("beauty6")],
    brandColor: "#e63946",
  },
};

export function demoPlan(templateId: string): ReelPlan {
  const sample = SAMPLES[templateId] ?? SAMPLES["festive-offer"];
  return buildFallbackPlan({ ...sample, templateId, lang: "hi" });
}

export const demoTemplateIds = TEMPLATES.map((t) => t.id);
