import Replicate from "replicate"

export async function POST(req: Request) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return Response.json({ error: "REPLICATE_API_TOKEN is not configured" }, { status: 500 })
  }

  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 })
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })

    // Run the model with the correct input format
    const prediction = await replicate.predictions.create({
      version: "8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f",
      input: {
        prompt: prompt,
        num_inference_steps: 50,
        guidance_scale: 7.5,
        negative_prompt: "ugly, blurry, poor quality, duplicate, mutated, deformed",
      },
    })

    // Wait for the prediction to complete
    let finalPrediction = await replicate.predictions.get(prediction.id)
    while (finalPrediction.status !== "succeeded" && finalPrediction.status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      finalPrediction = await replicate.predictions.get(prediction.id)
    }

    if (finalPrediction.status === "failed") {
      throw new Error("Image generation failed")
    }

    // The output should be an array with the image URL
    const imageUrl = finalPrediction.output

    if (!imageUrl) {
      throw new Error("No image URL in the response")
    }

    return Response.json({ imageUrl })
  } catch (error) {
    console.error("Image generation error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 },
    )
  }
}

