import { OpenAIApi, Configuration } from "openai-edge";

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(config);

export async function getEmbeddings(text: string) {
    try {
        const response = await openai.createEmbedding({
            model: "text-embedding-3-small",
            input: text.replace(/\n/g, ' '),
            dimensions: 1024,
        } as any)
        const result = await response.json();
        return result.data[0].embedding as number[];

    } catch (error) {
        console.error("Error getting embeddings...", error);
        throw error;
    }
}