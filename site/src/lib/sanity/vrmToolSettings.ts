// site/src/lib/sanity/vrmToolSettings.ts
import { sanityClient } from "./client";

export type VrmToolSettings = {
  title?: string;
  intro?: string;
  disclaimer?: string;
};

export async function getVrmToolSettings(): Promise<VrmToolSettings | null> {
  const query = /* groq */ `
    *[_type == "vrmToolSettings"][0]{
      title,
      intro,
      disclaimer
    }
  `;

  const result = await sanityClient.fetch(query);
  return result || null;
}
