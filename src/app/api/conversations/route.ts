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
    const { userId, isGroup, members, name } = body;

    if (isGroup && (!members || members.length < 2 || !name)) {
      return new NextResponse('Invalid data', { status: 400 });
    }

    if (isGroup) {
      return await handleGroupConversation(currentUser, members, name);
    } else {
      return await handleSingleConversation(currentUser, userId);
    }
  } catch (error) {
    console.error('Conversation creation error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

async function handleGroupConversation(currentUser: any, members: any[], name: string) {
  const newConversation = await prisma.conversation.create({
    data: {
      name,
      isGroup: true,
      users: {
        connect: [
          ...members.map((member: { value: string }) => ({ id: member.value })),
          { id: currentUser.id }
        ]
      }
    },
    include: { users: true }
  });

  // Trigger Pusher events in bulk
  const pusherPromises = newConversation.users
    .filter(user => user.email !== null)
    .map(user => 
      pusherServer.trigger(user.email!, "conversation:new", newConversation)
    );
  
  await Promise.all(pusherPromises);

  return NextResponse.json(newConversation);
}

async function handleSingleConversation(currentUser: any, userId: string) {
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { userIds: { has: currentUser.id } },
        { userIds: { has: userId } }
      ]
    },
    include: { users: true }
  });

  if (existingConversation) {
    return NextResponse.json(existingConversation);
  }

  const newConversation = await prisma.conversation.create({
    data: {
      users: {
        connect: [{ id: currentUser.id }, { id: userId }]
      }
    },
    include: { users: true }
  });

  // Trigger Pusher events in bulk
  const pusherPromises = newConversation.users
    .filter(user => user.email !== null)
    .map(user => 
      pusherServer.trigger(user.email!, "conversation:new", newConversation)
    );
  
  await Promise.all(pusherPromises);

  return NextResponse.json(newConversation);
}
