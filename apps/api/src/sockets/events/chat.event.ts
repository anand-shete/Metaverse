import { ChatModel } from "@models/chat.model";
import { triggerMetabotService } from "@service/metabot.service";
import { ChatUserType } from "@metaverse/shared/enum";
import { SocketContent } from "@utils/interface";
import { PopulatedChat } from "@metaverse/shared/interface";

export const registerChatEvents = (ctx: SocketContent) => {
  const { socket, fastify } = ctx;

  socket.on("chat:history:request", async () => {
    const chats = await ChatModel.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate<{ userId: { username: string } }>("userId", "username -_id")
      .select("message notes sender userId createdAt -_id")
      .lean<PopulatedChat[]>();

    const result = chats.map(chat => ({
      message: chat.message,
      username: chat.sender === ChatUserType.USER ? chat.userId?.username : "Metabot",
      timestamp: new Date(chat.createdAt).getTime(),
      notes: chat.notes,
    }));

    socket.emit("chat:history", result.reverse());
  });

  socket.on("chat:send", async (message: string) => {
    const { id: userId, username } = socket.data.user;

    const userChat = await ChatModel.create({ message, userId });
    fastify.io.emit("chat:message", { username, message, timestamp: userChat.createdAt.getTime() });

    const hasMetabot = message.toLowerCase().includes("metabot");
    if (!hasMetabot) return;

    const metabotResponse = await triggerMetabotService(message);
    if (!metabotResponse.success) {
      fastify.log.error(metabotResponse.message);
      fastify.io.emit("chat:message", {
        username: "Metabot",
        message:
          "Oops! I hit a snag while scanning the Metaverse archives. I couldn't process that request right now—please try rephrasing your search or check your connection!",
        timestamp: Date.now(),
      });

      return;
    }

    const botChat = await ChatModel.create({
      message: metabotResponse.message,
      sender: ChatUserType.METABOT,
      notes: metabotResponse.notes ?? [],
    });

    fastify.io.emit("chat:message", {
      username: "Metabot",
      message: metabotResponse.message,
      timestamp: botChat.createdAt.getTime(),
      notes: metabotResponse.notes,
    });
  });
};
