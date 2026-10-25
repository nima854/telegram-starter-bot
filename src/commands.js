
const OWNER_ID = 8940262155;
const DELETE_AFTER_MS = 30_000;

export function registerCommands(bot) {
  // هر محتوایی که مدیر برای ربات می‌فرستد، لینک اختصاصی می‌گیرد.
  bot.on("message", async (ctx) => {
    if (ctx.from?.id !== OWNER_ID) return;
    if (!ctx.message || ctx.message.text?.startsWith("/")) return;

    try {
      const payload = ctx.message;

      const content = {
        text: payload.text,
        caption: payload.caption,
        photo: payload.photo?.map((p) => p.file_id),
        video: payload.video?.file_id,
        document: payload.document?.file_id,
        animation: payload.animation?.file_id,
        audio: payload.audio?.file_id,
        voice: payload.voice?.file_id,
        video_note: payload.video_note?.file_id,
        sticker: payload.sticker?.file_id,
      };

      if (!Object.values(content).some((v) => v !== undefined)) {
        await ctx.reply("این نوع محتوا فعلاً پشتیبانی نمی‌شود.");
        return;
      }

      const token = Buffer.from(JSON.stringify(content)).toString("base64url");
      const me = await ctx.api.getMe();

      await ctx.reply(
        `لینک اختصاصی محتوای شما:\nhttps://t.me/${me.username}?start=${token}`
      );
    } catch (error) {
      console.error(error);
      await ctx.reply("ساخت لینک ناموفق بود.");
    }
  });

  // کاربر با لینک وارد می‌شود و محتوای موردنظر را دریافت می‌کند.
  bot.command("start", async (ctx) => {
    const payload = ctx.match?.trim();

    if (!payload) {
      await ctx.reply("سلام! برای دریافت محتوا، لینک اختصاصی آن را باز کن.");
      return;
    }

    try {
      const content = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8")
      );

      let sent;

      if (content.photo) {
        sent = await ctx.replyWithPhoto(content.photo.at(-1), {
          caption: content.caption,
        });
      } else if (content.video) {
        sent = await ctx.replyWithVideo(content.video, {
          caption: content.caption,
        });
      } else if (content.document) {
        sent = await ctx.replyWithDocument(content.document, {
          caption: content.caption,
        });
      } else if (content.animation) {
        sent = await ctx.replyWithAnimation(content.animation, {
          caption: content.caption,
        });
      } else if (content.audio) {
        sent = await ctx.replyWithAudio(content.audio, {
          caption: content.caption,
        });
      } else if (content.voice) {
        sent = await ctx.replyWithVoice(content.voice);
      } else if (content.video_note) {
        sent = await ctx.replyWithVideoNote(content.video_note);
      } else if (content.sticker) {
        sent = await ctx.replyWithSticker(content.sticker);
      } else if (content.text) {
        sent = await ctx.reply(content.text);
      } else {
        await ctx.reply("این لینک محتوا ندارد یا معتبر نیست.");
        return;
      }

      setTimeout(async () => {
        try {
          await ctx.api.deleteMessage(ctx.chat.id, sent.message_id);
        } catch (error) {
          console.error("حذف پیام ناموفق بود:", error.message);
        }
      }, DELETE_AFTER_MS);
    } catch (error) {
      console.error(error);
      await ctx.reply("لینک نامعتبر است یا محتوای آن قابل ارسال نیست.");
    }
  });
}
