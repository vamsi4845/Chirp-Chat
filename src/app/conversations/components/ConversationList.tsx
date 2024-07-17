"use client";

import useConversation from "@/app/hooks/useConversation";
import { FullConversationType } from "@/app/types";
import { User } from "@prisma/client";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MdOutlineGroupAdd } from "react-icons/md";
import ConversationBox from "./ConversationBox";
import GroupChatModal from "./GroupChatModal";
import { useSession } from "next-auth/react";
import { find } from "lodash";
import usePusherSubscription from "@/app/hooks/usePusherSubscription";

interface ConversationListProps {
  initialItems: FullConversationType[];
  users: User[];
}

const ConversationList: React.FC<ConversationListProps> = ({
  initialItems,
  users,
}) => {
  const session = useSession();
  const [items, setItems] = useState(initialItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { conversationId, isOpen } = useConversation();

  const pusherKey = useMemo(() => session.data?.user?.email, [session.data?.user?.email]);

  const newHandler = useCallback((conversation: FullConversationType) => {
    setItems((current) => {
      if (find(current, { id: conversation.id })) {
        return current;
      }
      return [conversation, ...current];
    });
  }, []);

  const updateHandler = useCallback((conversation: FullConversationType) => {
    setItems((current) =>
      current.map((currentConversation) =>
        currentConversation.id === conversation.id
          ? { ...currentConversation, messages: conversation.messages }
          : currentConversation
      )
    );
  }, []);

  const removeHandler = useCallback((conversation: FullConversationType) => {
    setItems((current) => current.filter((convo) => convo.id !== conversation.id));
    if (conversationId === conversation.id) {
      router.push("/conversations");
    }
  }, [conversationId, router]);

  usePusherSubscription(pusherKey ?? undefined, {
    "conversation:new": newHandler,
    "conversation:update": updateHandler,
    "conversation:remove": removeHandler,
  });

  useEffect(() => {
    router.prefetch('/users');
    router.prefetch('/conversations');
  }, [router]);

  const handleModalOpen = useCallback(() => setIsModalOpen(true), []);
  const handleModalClose = useCallback(() => setIsModalOpen(false), []);

  const memoizedItems = useMemo(() => items, [items]);

  return (
    <>
      <GroupChatModal
        users={users}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
      <aside
        className={clsx(
          `fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-y-auto border-r border-gray-200`,
          isOpen ? "hidden" : "block w-full left-0"
        )}
      >
        <div className="px-5">
          <div className="flex justify-between mb-4 pt-4">
            <div className="text-2xl font-bold text-neutral-800">Messages</div>
            <div
              onClick={handleModalOpen}
              className="rounded-full p-2 bg-gray-100 text-gray-600 cursor-pointer hover:opacity-75 transition"
            >
              <MdOutlineGroupAdd size={20} />
            </div>
          </div>
          {memoizedItems.map((item) => (
            <ConversationBox
              key={item.id}
              data={item}
              selected={conversationId === item.id}
            />
          ))}
        </div>
      </aside>
    </>
  );
};
export default ConversationList;