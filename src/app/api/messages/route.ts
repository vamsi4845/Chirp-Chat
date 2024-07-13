import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { message, image, conversationId } = body;

    const result = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        messages: {
          create: {
            body: message,
            image: image,
            sender: { connect: { id: currentUser.id } },
            seen: { connect: { id: currentUser.id } }
          }
        }
      },
      include: {
        users: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { seen: true, sender: true }
        }
      }
    });

    const newMessage = result.messages[0];

    // Remove setTimeout and execute Pusher triggers immediately
    await pusherServer.trigger(conversationId, "messages:new", newMessage);

    const updatePromises = result.users.map(async (user) => {
      if (user.email) {
        await pusherServer.trigger(user.email, "conversation:update", {
          id: conversationId,
          messages: [newMessage]
        });
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('ERROR_MESSAGES_POST', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}