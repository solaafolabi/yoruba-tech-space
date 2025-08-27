import React, { useState, useEffect } from "react";
import supabase from "../../supabaseClient";
import { FaStar } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./testimonial.css";

export default function Testimonial() {
  const { i18n } = useTranslation();
  const [imageTestimonials, setImageTestimonials] = useState([]);
  const [videoTestimonials, setVideoTestimonials] = useState([]);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data.length > 0) {
      setImageTestimonials(
        data.filter((t) => !t.youtube_url && !t.youtube_url_yo)
      );
      setVideoTestimonials(
        data.filter((t) => t.youtube_url || t.youtube_url_yo)
      );
    }
  };

  const extractVideoId = (url) => {
    const regExp =
      /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    return match && match[1].length === 11 ? match[1] : null;
  };

  const imageSliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 7000,
    arrows: true,
    adaptiveHeight: true,
  };

  const videoSliderSettings = { ...imageSliderSettings, autoplaySpeed: 8000 };

  return (
    <section className="bg-[#0D1B2A] text-white py-16 px-4 md:px-10 relative overflow-hidden">
      {/* Subtle blue glow */}
      <div className="absolute top-0 left-0 w-[250px] h-[250px] bg-blue-500 opacity-10 blur-3xl rounded-full"></div>

      <h2 className="text-3xl md:text-4xl font-bold text-blue-400 text-center mb-10 relative z-10">
        {i18n.language === "yo"
          ? "Ẹ̀rí àwọn Akẹ́kọ̀ọ́"
          : "Student Testimonials"}
      </h2>

      {/* Image Testimonials */}
      {imageTestimonials.length > 0 && (
        <div className="flex justify-center mb-14 relative z-10">
          <div className="w-full max-w-md">
            <Slider {...imageSliderSettings}>
              {imageTestimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#1B263B] rounded-xl shadow-lg border border-transparent hover:border-blue-500 p-6 mx-3 text-center flex flex-col items-center hover:scale-[1.02] transition duration-300"
                >
                  <img
                    src={t.image_url}
                    alt={t.name_en}
                    className="w-20 h-20 mx-auto rounded-full border-2 border-blue-400 shadow mb-3 object-cover"
                    loading="lazy"
                  />

                  <h3 className="text-xl font-bold text-white">
                    {i18n.language === "yo" ? t.name_yo : t.name_en}
                  </h3>
                  {t.role_en && (
                    <p className="text-gray-400 mb-2 text-sm">
                      {i18n.language === "yo" ? t.role_yo : t.role_en}
                    </p>
                  )}

                  <p className="text-gray-200 italic mb-3 leading-relaxed text-sm">
                    {i18n.language === "yo" ? t.message_yo : t.message_en}
                  </p>

                  {t.rating > 0 && (
                    <div className="flex justify-center gap-1 text-blue-400 text-base">
                      {[...Array(t.rating)].map((_, i) => (
                        <FaStar key={i} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Slider>
          </div>
        </div>
      )}

      {/* Video Testimonials */}
      {videoTestimonials.length > 0 && (
        <div className="flex justify-center relative z-10">
          <div className="w-full max-w-xl">
            <Slider {...videoSliderSettings}>
              {videoTestimonials.map((t) => {
                const selectedVideoUrl =
                  i18n.language === "yo"
                    ? t.youtube_url_yo || t.youtube_url
                    : t.youtube_url || t.youtube_url_yo;

                const videoId = extractVideoId(selectedVideoUrl);

                return (
                  <div
                    key={t.id}
                    className="bg-[#1B263B] rounded-xl shadow-lg border border-transparent hover:border-blue-500 p-5 mx-3 text-center flex flex-col items-center hover:scale-[1.02] transition duration-300"
                  >
                    {videoId ? (
                      <div className="relative w-full mx-auto h-48 sm:h-60 md:h-72 overflow-hidden rounded-lg shadow-md mb-4">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title="Testimonial Video"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <p className="text-gray-400 italic mb-4 text-sm">
                        No video available
                      </p>
                    )}

                    {t.image_url && (
                      <img
                        src={t.image_url}
                        alt={t.name_en}
                        className="w-20 h-20 mx-auto rounded-full border-2 border-blue-400 shadow mb-3 object-cover"
                        loading="lazy"
                      />
                    )}

                    <h3 className="text-xl font-bold text-white">
                      {i18n.language === "yo" ? t.name_yo : t.name_en}
                    </h3>
                    {t.role_en && (
                      <p className="text-gray-400 mb-2 text-sm">
                        {i18n.language === "yo" ? t.role_yo : t.role_en}
                      </p>
                    )}

                    <p className="text-gray-200 italic mb-3 leading-relaxed text-sm">
                      {i18n.language === "yo" ? t.message_yo : t.message_en}
                    </p>
                  </div>
                );
              })}
            </Slider>
          </div>
        </div>
      )}
    </section>
  );
}
