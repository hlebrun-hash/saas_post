import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function generateImage(prompt: string): Promise<string> {
  const output = await replicate.run(
    "black-forest-labs/flux-schnell",
    {
      input: {
        prompt: `${prompt}, high quality, professional, modern, clean design`,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 80,
      },
    }
  );

  // Replicate returns an array of URLs or a ReadableStream
  if (Array.isArray(output) && output.length > 0) {
    return String(output[0]);
  }

  // Handle ReadableStream (newer Replicate SDK)
  if (output && typeof (output as unknown as { url?: () => Promise<URL> }).url === "function") {
    const url = await (output as unknown as { url: () => Promise<URL> }).url();
    return url.toString();
  }

  throw new Error("Replicate n'a pas retourné d'image");
}
