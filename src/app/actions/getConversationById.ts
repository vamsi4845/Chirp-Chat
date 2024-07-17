import prisma from "@/app/libs/prismadb";
import getCurrentUser from "./getCurrentUser";
import { ObjectId } from 'mongodb';

const getConversationById = async (
  conversationId: string
) => {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.email) {
      return null;
    }

    // Validate the conversationId
    if (!conversationId || !ObjectId.isValid(conversationId)) {
      return null; // Return null instead of throwing an error
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId
      },
      include: { 
        users: true,
      },
    });

    if (!conversation) {
      return null; // Return null instead of throwing an error
    }

    return conversation;
  } catch (error: any) {
    console.log(error, 'SERVER_ERROR')
    return null;
  }
};

export default getConversationById;