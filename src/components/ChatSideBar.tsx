'use client'
import React from 'react'
import { DrizzleChat } from '@/lib/db/schema'
import Link from 'next/link'
import { Button } from './ui/button'
import { PlusCircle, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from 'axios'
import SubscriptionButton from './SubscriptionButton'



type Props = {
    chats: DrizzleChat[],
    chatId: number
    isPro: boolean
}

const ChatSideBar = ({chats, chatId, isPro} : Props) => {
  const [loading, setLoading] = React.useState(false);
  const handleSubscription = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/stripe');
      const {url} = response.data;
      window.location.href = url;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
    
  }
  return (
    <div className='w-full h-screen p-4 text-gray-200 bg-gray-900 flex flex-col'>
        <Link href = '/'>
            <Button className='w-full border-dashed border-white border'>
                <PlusCircle className='mr-2 h-4 w-4'/>
                New Chat
            </Button>
        </Link>

        <div className='flex flex-col gap-2 mt-4 flex-1 overflow-y-auto'>
            {chats.map(chat => (
                <Link key = {chat.id} href = {`/chat/${chat.id}`}>
                    <div className={cn ('rounded-lg p-3 text-slate-300 flex items-center',{
                        'bg-blue-600 text-white': chat.id === chatId,
                        'hover:text-white': chat.id !== chatId,
                    })}>
                        <MessageCircle className='mr-2 h-4 w-4'/>
                        <p className='w-full overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis'>
                            {chat.pdfName}
                        </p>
                    </div>
                </Link>
            ))}

            
        </div>

        <div className='w-full mt-4 border-t border-slate-700 pt-4'>
            <div className = 'flex items-center gap-2 text-sm text-slate-500 flex-wrap justify-center mb-4'>
                <Link href='/'>
                    Home
                </Link>
                <Link href='/'>
                    Source
                </Link>
            </div>
            <SubscriptionButton isPro={isPro}/>
        </div>
    </div>
  )
}

export default ChatSideBar