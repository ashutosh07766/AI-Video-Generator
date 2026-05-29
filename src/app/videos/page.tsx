"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Play, X, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { ReelPlayer } from "@/components/ReelPlayer";
import { AvatarPlayer } from "@/components/AvatarPlayer";
import { useI18n } from "@/lib/i18n/provider";
import { listReels, deleteReel, SavedReel } from "@/lib/store";
import { fetchMe } from "@/lib/auth";
import { ReelPlan } from "@/lib/templates";
import { AvatarPlan } from "@/lib/avatars";

type ServerVideo = {
  id: string;
  kind: "reel" | "avatar";
  title: string;
  createdAt: string;
  meta?: { plan?: ReelPlan | AvatarPlan; voiceDataUrl?: string };
};

export default function VideosPage() {
  const { t } = useI18n();
  const [reels, setReels] = useState<SavedReel[]>([]);
  const [open, setOpen] = useState<SavedReel | null>(null);
  const [serverMode, setServerMode] = useState(false);

  useEffect(() => {
    (async () => {
      const me = await fetchMe();
      if (me) {
        setServerMode(true);
        const data = await fetch("/api/videos")
          .then((r) => r.json())
          .catch(() => ({ videos: [] }));
        const mapped: SavedReel[] = (data.videos as ServerVideo[])
          .filter((v) => v.meta?.plan)
          .map((v) => ({
            id: v.id,
            createdAt: new Date(v.createdAt).getTime(),
            kind: v.kind,
            title: v.title,
            plan: v.meta!.plan!,
            voiceDataUrl: v.meta?.voiceDataUrl,
          }));
        setReels(mapped);
      } else {
        setReels(listReels());
      }
    })();
  }, []);

  async function remove(id: string) {
    if (serverMode) await fetch(`/api/videos?id=${id}`, { method: "DELETE" });
    else deleteReel(id);
    setReels((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <main className="min-h-screen bg-cream">
      <Header />
      <div className="container-px py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-3xl font-extrabold">{t("videos.title")}</h1>
          <Link href="/create" className="btn-primary !py-2 text-sm">
            <Plus className="h-4 w-4" /> {t("videos.make")}
          </Link>
        </div>

        {reels.length === 0 ? (
          <div className="card mx-auto max-w-md p-10 text-center">
            <p className="text-ink-soft">{t("videos.empty")}</p>
            <Link href="/create" className="btn-primary mt-5 inline-flex">
              {t("videos.make")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
            {reels.map((r) => (
              <div key={r.id} className="group">
                <button onClick={() => setOpen(r)} className="relative block w-full">
                  <div className="phone pointer-events-none">
                    {r.kind === "avatar" ? (
                      <AvatarPlayer plan={r.plan as AvatarPlan} controls={false} />
                    ) : (
                      <ReelPlayer plan={r.plan as ReelPlan} controls={false} />
                    )}
                  </div>
                  <span className="absolute inset-0 grid place-items-center rounded-[2.2rem] bg-black/0 transition group-hover:bg-black/30">
                    <Play className="h-10 w-10 text-white opacity-0 transition group-hover:opacity-100" />
                  </span>
                </button>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{r.title}</span>
                  <button onClick={() => remove(r.id)} className="text-ink-muted hover:text-brand-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-6 backdrop-blur"
            onClick={() => setOpen(null)}
          >
            <div className="w-full max-w-[320px]" onClick={(e) => e.stopPropagation()}>
              <div className="phone">
                {open.kind === "avatar" ? (
                  <AvatarPlayer plan={open.plan as AvatarPlan} autoPlay controls />
                ) : (
                  <ReelPlayer
                    plan={open.plan as ReelPlan}
                    voiceSrc={open.voiceDataUrl}
                    browserVoice
                    controls
                  />
                )}
              </div>
              <button onClick={() => setOpen(null)} className="btn-ghost mt-4 w-full">
                <X className="h-5 w-5" /> {t("videos.close")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
