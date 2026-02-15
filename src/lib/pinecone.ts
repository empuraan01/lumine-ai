import { Pinecone, PineconeRecord, } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './s3-server';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { metadata } from '@/app/layout';
import { Document, RecursiveCharacterTextSplitter } from "@pinecone-database/doc-splitter";
import { getEmbeddings } from './embeddings';
import md5 from 'md5';
import { convertToASCII } from './utils';

let pinecone: Pinecone | null = null;

export const getPineconeClient = async () => {
    if (!pinecone) {
        pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    }
    return pinecone;
}

type PDFPage = {
    pageContent: string,
    metadata: {
        loc: { pageNumber: number }
    }
}

export async function loadS3IntoPineCone(file_key: string) {
    console.log("Loading file into Pinecone...");
    const file_name = await downloadFromS3(file_key);
    if (!file_name) {
        throw new Error("File not found");
    }
    const loader = new PDFLoader(file_name);
    const pages = await loader.load() as PDFPage[];
    console.log("File loaded successfully...");

    const documents = await Promise.all(pages.map(prepareDocument));

    const vectors = await Promise.all(documents.flat().map(embedDocument));

    const client = await getPineconeClient();
    const pineconeIndex = await client.index(process.env.PINECONE_INDEX_NAME!);
    console.log("Inserting vector to PineconeDB");

    const namespace = convertToASCII(file_key);
    const pineconeNamespace = pineconeIndex.namespace(namespace);

    await pineconeNamespace.upsert(vectors);

    console.log("Successfully inserted vectors into PineconeDB");
    return documents[0];
}

async function embedDocument(doc: Document) {
    try {
        const embeddings = await getEmbeddings(doc.pageContent);
        const hash = md5(doc.pageContent);

        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber,
            }
        } as PineconeRecord;
    } catch (error) {
        console.error("Error embedding document...", error);
        throw error;
    }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
    const encoder = new TextEncoder();
    return new TextDecoder('utf-8').decode(encoder.encode(str).slice(0, bytes));
}

async function prepareDocument(page: PDFPage) {
    let { pageContent, metadata } = page;
    pageContent = pageContent.replace(/\n/g, '');

    const splitter = new RecursiveCharacterTextSplitter()
    const docs = await splitter.splitDocuments([
        new Document({
            pageContent,
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000)
            },
        })
    ])
    return docs;
}