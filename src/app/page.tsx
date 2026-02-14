import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { LogIn } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { checkSubscription } from "@/lib/subscription";
import SubscriptionButton from "@/components/SubscriptionButton";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { chats } from "@/lib/db/schema";
import { ArrowRight } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;
  const isPro = await checkSubscription(); 
  let firstChat;
  if (userId){
    firstChat = await db.select().from(chats).where(eq(chats.userId, userId));
    if (firstChat){
      firstChat = firstChat[0];
    }
  }

  return (
    <div className= "w-screen min-h-screen bg-gradient-to-r from-rose-100 to-teal-100"> 
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className= "flex flex-col items-center text-center">
          <div className="felx items-center">
            <h1 className="mr-3 text-5xl font-semibold tracking-tight">Lumine</h1>
            <p className="text-foreground/70 font-medium">Throw light on your PDFs</p>
            <UserButton afterSignOutUrl="/"/>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {isAuth && firstChat && <Link href={`/chat/${firstChat.id}`}><Button>Go to your chats <ArrowRight className = "ml-2"/></Button></Link>}
            <SubscriptionButton isPro={isPro} />
          </div>

          <p className="max-w-xl mt-1 text-lg text-slate-600">
            Become a lumineer today, and start understanding your PDFs and documents through AI
          </p>

          <div className="w-full mt-4">
            {isAuth ? (<FileUpload />):(
              <Link href="/sign-in">
                <Button>
                  <LogIn className="w-4 h-4 mr-2"/>
                    Login to get started!
                  </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
