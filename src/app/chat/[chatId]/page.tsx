import React from 'react'
import { auth } from "@clerk/nextjs/server"
import { chats } from '@/lib/db/schema';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import ChatSideBar from '@/components/ChatSideBar';
import PDFViewer from '@/components/PDFViewer';
import ChatComponent from '@/components/ChatComponent';
import { checkSubscription } from '@/lib/subscription';

type Props = {
    params: Promise<{
        chatId: string;
    }>
}

const ChatPage = async ({ params }: Props) => {
    const { chatId } = await params;
    const { userId } = await auth();
    const isPro = await checkSubscription();
    if (!userId) {
        return redirect("/sign-in");
    }
    const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
    if (!_chats) {
        return redirect("/");
    }
    if (!_chats.find((chat) => chat.id === parseInt(chatId))) {
        return redirect("/");
    }

    const currentChat = _chats.find((chat) => chat.id === parseInt(chatId));
    
    return (
        <div className='flex h-screen max-h-screen overflow-hidden'>
            <div className='flex w-full max-h-screen overflow-hidden'>
                <div className='flex-[1] max-w-xs'>
                    <ChatSideBar chats={_chats} chatId={parseInt(chatId)} isPro={isPro} />
                </div>
                <div className='max-h-screen p-4 overflow-scroll flex-[5]'>
                    <PDFViewer pdf_url={currentChat?.pdfUrl || ''}></PDFViewer>
                </div>
                <div className='flex-[3] border-l-4 border-l-slate-200'>
                    <ChatComponent chatId={parseInt(chatId)}></ChatComponent>
                </div>
            </div>
        </div>
    )

}

export default ChatPage