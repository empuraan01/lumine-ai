import { Pinecone } from "@pinecone-database/pinecone";
import { getPineconeClient } from "./pinecone";
import { convertToASCII } from "./utils";
import { getEmbeddings } from "./embeddings";

export async function getMatchesFromEmbeddings(embeddings: number[], file_key: string) {
    const pinecone = await getPineconeClient();
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME || "chatpdf");

    try {
        const namespace = convertToASCII(file_key);
        const pineconeNamespace = index.namespace(namespace);
        const queryResult = await pineconeNamespace.query({
            topK: 5,
            vector: embeddings,
            includeMetadata: true,
        })
        return queryResult.matches || [];
    } catch (error) {
        console.error("Error getting matches from embeddings", error);
        throw error;
    }

}


export async function getContext(query: string, file_key: string) {
    const queryEmbeddings = await getEmbeddings(query);
    const matches = await getMatchesFromEmbeddings(queryEmbeddings, file_key);

    const qualifyingDocs = matches.filter((match) => match.score !== undefined);

    type Metadata = {
        text: string;
        pageNumber: number;
    }

    let docs = qualifyingDocs.map(match => (match.metadata as Metadata).text);

    return docs.join("\n").substring(0, 3000);

}

