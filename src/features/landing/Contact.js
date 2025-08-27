import React, { useState } from "react";
import supabase from "../../supabaseClient";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

export default function Contact() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, type: "", message: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("contact_messages").insert([form]);

    if (error) {
      setPopup({
        show: true,
        type: "error",
        message:
          lang === "yo"
            ? "⚠️ Ìfiránṣẹ́ kò lọ. Jọwọ gbìyànjú lẹ́ẹ̀kansi."
            : "⚠️ Your message could not be sent. Please try again.",
      });
    } else {
      setPopup({
        show: true,
        type: "success",
        message:
          lang === "yo"
            ? "✅ Ìfiránṣẹ́ rẹ ti fi ránṣẹ́!"
            : "✅ Your message has been sent!",
      });
      setForm({ name: "", email: "", message: "" });
    }
    setLoading(false);
  };

  return (
    <section className="bg-[#0A192F] text-white pt-28 pb-24 px-6 md:px-20 min-h-screen relative overflow-hidden">
      {/* Subtle Glow */}
      <div className="absolute top-10 right-10 w-[250px] h-[250px] bg-blue-400 opacity-10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-10 left-10 w-[200px] h-[200px] bg-yellow-400 opacity-10 blur-3xl rounded-full"></div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start relative z-10">
        {/* LEFT */}
        <div className="bg-[#112240] rounded-2xl p-8 shadow-xl border border-blue-500 relative">
          <h2 className="text-3xl font-bold text-blue-400 mb-6">
            {lang === "yo" ? "Kàn sí Wa" : "Contact Us"}
          </h2>

          <div className="space-y-4 mb-8 text-sm md:text-base">
            <p>
              📍 <strong>{lang === "yo" ? "Adirẹsi:" : "Address:"}</strong>{" "}
              Ikirun, Osun State, Nigeria
            </p>
            <p>
              📧 <strong>Email:</strong>{" "}
              <a
                href="mailto:yorubatechspace@gmail.com"
                className="text-yellow-400 underline"
              >
                yorubatechspace@gmail.com
              </a>
            </p>
            <p>
              💬 <strong>WhatsApp:</strong>{" "}
              <a
                href="https://wa.me/2348123456789"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 underline"
              >
                +234 812 345 6789
              </a>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              type="text"
              placeholder={lang === "yo" ? "Orúkọ Rẹ" : "Your Name"}
              className="w-full p-3 rounded bg-[#0A192F] text-white border border-blue-500 focus:border-yellow-400 outline-none transition"
              required
            />
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              placeholder="Email"
              className="w-full p-3 rounded bg-[#0A192F] text-white border border-blue-500 focus:border-yellow-400 outline-none transition"
              required
            />
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder={lang === "yo" ? "Ìfiranṣẹ́ Rẹ" : "Your Message"}
              rows="5"
              className="w-full p-3 rounded bg-[#0A192F] text-white border border-blue-500 focus:border-yellow-400 outline-none transition"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white font-bold px-6 py-3 rounded hover:bg-blue-700 hover:scale-105 transition-all w-full border border-yellow-400"
            >
              {loading
                ? lang === "yo"
                  ? "Ìfiránṣẹ́ ń lọ..."
                  : "Sending..."
                : lang === "yo"
                ? "Firanṣẹ́"
                : "Send Message"}
            </button>
          </form>
        </div>

        {/* RIGHT: Map */}
        <div className="w-full h-96 md:h-full rounded-2xl overflow-hidden border border-blue-500 shadow-xl">
          <iframe
            title="Ikirun Map"
            src="https://www.google.com/maps?q=Ikirun+Osun+State,+Nigeria&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </div>
      </div>

      {/* ✅ Popup Modal */}
      <AnimatePresence>
        {popup.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setPopup({ ...popup, show: false })}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={`p-8 rounded-xl shadow-2xl text-center max-w-md mx-4 ${
                popup.type === "success"
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              <h3 className="text-2xl font-bold mb-3">
                {popup.type === "success"
                  ? lang === "yo"
                    ? "Àṣeyọrí ✅"
                    : "Success ✅"
                  : lang === "yo"
                  ? "Aṣiṣe ⚠️"
                  : "Error ⚠️"}
              </h3>
              <p className="text-lg">{popup.message}</p>
              <button
                onClick={() => setPopup({ ...popup, show: false })}
                className="mt-5 px-6 py-2 bg-white text-black font-semibold rounded hover:bg-gray-100 transition"
              >
                {lang === "yo" ? "Pa" : "Close"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
