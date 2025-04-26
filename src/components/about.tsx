import { Settings2, FileText, HelpCircle, Mic2, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center px-4 py-8 w-full h-full overflow-y-auto"
    >
      <Card className="bg-transparent backdrop-blur-xl border border-slate-200/60 w-full max-w-3xl">
        <CardContent className="p-6 text-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-slate-500" />
            <h1 className="font-bold text-slate-800 text-3xl">About</h1>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="flex items-center gap-2 mb-2 font-semibold text-slate-700 text-xl">
                <FileText className="w-5 h-5 text-slate-500" />
                What this app does
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                This web app helps you transcribe and analyze music by isolating parts of a song, detecting pitch and
                rhythm, and letting you loop complex sections for deeper practice. All of it runs directly in your
                browser—no installation needed.
              </p>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                It’s designed with musicians and learners in mind, especially when you want to focus on specific
                phrases, pick out harmonies, or follow along with polyphonic instruments.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-2 mb-2 font-semibold text-slate-700 text-xl">
                <Settings2 className="w-5 h-5 text-slate-500" />
                How to use it
              </h2>
              <ul className="space-y-2 text-slate-600 text-sm leading-relaxed list-disc list-inside">
                <li className="flex items-start gap-2">
                  <Mic2 className="mt-1 w-4 h-4 text-slate-500" /> Upload or record an audio clip from your device.
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="mt-1 w-4 h-4 text-slate-500" /> Slow down playback without affecting pitch, and
                  loop parts to practice.
                </li>
                <li className="flex items-start gap-2">
                  <FolderOpen className="mt-1 w-4 h-4 text-slate-500" /> Manage multiple projects and sessions from the
                  sidebar menu.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-center gap-2 mb-2 font-semibold text-slate-700 text-xl">
                <HelpCircle className="w-5 h-5 text-slate-500" />
                Tips & Notes
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                - Use headphones for best results when analyzing recordings.
                <br />
                - Try segmenting your audio by phrase to transcribe complex sections easier.
                <br />- Pitch detection may vary depending on the clarity of the source audio.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-2 mb-2 font-semibold text-slate-700 text-xl">
                <HelpCircle className="w-5 h-5 text-slate-500" />
                Need help?
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                If you run into issues, contact the developer or check the documentation. The goal is to keep the
                experience simple and focused around music learning.
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
