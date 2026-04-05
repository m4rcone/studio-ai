import { ChatInterface } from "@/components/studio/ChatInterface";
import { ChatSidebar } from "@/components/studio/ChatSidebar";

export default function ChatPage() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 gap-4 overflow-hidden px-4 py-4">
      <ChatInterface />
      <ChatSidebar />
    </div>
  );
}
