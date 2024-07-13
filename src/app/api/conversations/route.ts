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
  // Prepare conversation data
  const conversationData = {
    name,
    isGroup: true,
    users: [
      ...members.map((member: { value: string }) => ({ id: member.value })),
      { id: currentUser.id }
    ]
  };

  // Trigger Pusher events before database creation
  await pusherServer.trigger(
    conversationData.users.map(user => user.id),
    "conversation:new",
    conversationData
  );

  const newConversation = await prisma.conversation.create({
    data: {
      ...conversationData,
      users: {
        connect: conversationData.users
      }
    },
    include: { users: true }
  });

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

  // Prepare conversation data
  const conversationData = {
    users: [{ id: currentUser.id }, { id: userId }]
  };

  // Trigger Pusher events before database creation
  await pusherServer.trigger(
    conversationData.users.map(user => user.id),
    "conversation:new",
    conversationData
  );

  const newConversation = await prisma.conversation.create({
    data: {
      users: {
        connect: conversationData.users
      }
    },
    include: { users: true }
  });

  return NextResponse.json(newConversation);
}