import { generateText } from "ai";
import { put, list } from "@vercel/blob";
import nouns from "../src/data/nouns.json";

const MODEL = "google/gemini-3-pro-image";
const BLOB_DIR = "images";

async function main() {
  const uniqueNouns = [...new Set(nouns)];

  // Find which nouns already have images
  const existing = new Set<string>();
  let cursor: string | undefined;
  do {
    const res = await list({ prefix: `${BLOB_DIR}/`, cursor });
    for (const blob of res.blobs) {
      const name = blob.pathname.replace(`${BLOB_DIR}/`, "").replace(/\.[^.]+$/, "");
      existing.add(name);
    }
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);

  // Find the next noun that doesn't have an image yet
  const noun = uniqueNouns.find((n) => !existing.has(n));
  if (!noun) {
    console.log("All nouns already have images!");
    return;
  }

  console.log(`Generating image for "${noun}" (${existing.size}/${uniqueNouns.length} done)...`);

  const result = await generateText({
    model: MODEL,
    prompt: `Generate an image: 256x256 pixel art of a ${noun}. Blank, white background.`,
  });

  const image = result.files?.find((f) => f.mediaType?.startsWith("image/"));
  if (!image) {
    console.error(`No image returned for "${noun}"`);
    process.exit(1);
  }

  const ext = image.mediaType?.split("/")[1] || "png";
  const buffer = Buffer.from(image.uint8Array);
  const pathname = `${BLOB_DIR}/${noun}.${ext}`;

  const blob = await put(pathname, buffer, {
    access: "public",
    contentType: image.mediaType || "image/png",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  console.log(`Uploaded: ${blob.url}`);
}

main().catch(console.error);
