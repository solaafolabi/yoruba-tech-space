import React, { useEffect, useState } from "react";
import supabase from "../../../supabaseClient";
import slugify from "slugify";
import AdminLayout from "../../../features/admin/layout/AdminLayout";

// Adjust these import paths if you place components in another folder.
// This assumes: src/components/admin/* and this file located in src/features/admin/... (so ../../../components/admin)
import LessonSelector from "./LessonSelector";
import DeleteQuizModal from "./DeleteQuizModal";
import LessonInfo from "./LessonInfo";
import ContentBlocks from "./ContentBlocks";
import QuizManager from "./QuizManager";
import ContentPreview from "./ContentPreview";
import ImageMatchManager from "./ImageMatchManager";

/* ---------- Main AdminLessonBuilder ---------- */
export default function AdminLessonBuilder({ adminId }) {
  // ENGLISH states
  const [coursesEn, setCoursesEn] = useState([]);
  const [modulesEn, setModulesEn] = useState([]);
  const [lessonsEnList, setLessonsEnList] = useState([]);
  const [selectedCourseEn, setSelectedCourseEn] = useState("");
  const [selectedModuleEn, setSelectedModuleEn] = useState("");
  const [selectedLessonEn, setSelectedLessonEn] = useState("");

  // YORUBA states
  const [coursesYo, setCoursesYo] = useState([]);
  const [modulesYo, setModulesYo] = useState([]);
  const [lessonsYoList, setLessonsYoList] = useState([]);
  const [selectedCourseYo, setSelectedCourseYo] = useState("");
  const [selectedModuleYo, setSelectedModuleYo] = useState("");
  const [selectedLessonYo, setSelectedLessonYo] = useState("");

  // Lesson bilingual fields
  const [titleEn, setTitleEn] = useState("");
  const [titleYo, setTitleYo] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionYo, setDescriptionYo] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [category, setCategory] = useState("");
  const [ageGroups, setAgeGroups] = useState([]);
  const [imageMatches, setImageMatches] = useState([]);


  // Content & quizzes
  const [contents, setContents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  // modal + UI states
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // active language & lesson
  const activeLanguage = selectedLessonEn ? "en" : selectedLessonYo ? "yo" : null;
  const activeLessonId = activeLanguage === "en" ? selectedLessonEn : selectedLessonYo;

  /* ---------- Fetch initial lists ---------- */
  useEffect(() => {
    async function fetchCoursesEn() {
      const { data, error } = await supabase.from("courses").select("id, title_en").order("created_at", { ascending: true });
      if (!error && data) setCoursesEn(data);
    }
    fetchCoursesEn();
  }, []);

  useEffect(() => {
    async function fetchCoursesYo() {
      const { data, error } = await supabase.from("courses").select("id, title_yo").order("created_at", { ascending: true });
      if (!error && data) setCoursesYo(data);
    }
    fetchCoursesYo();
  }, []);

  useEffect(() => {
    if (!selectedCourseEn) {
      setModulesEn([]);
      setSelectedModuleEn("");
      return;
    }
    async function fetchModulesEn() {
      const { data, error } = await supabase.from("modules").select("id, title_en").eq("course_id", selectedCourseEn).order("created_at", { ascending: true });
      if (!error && data) setModulesEn(data);
    }
    fetchModulesEn();
    setSelectedModuleEn("");
    setLessonsEnList([]);
    setSelectedLessonEn("");
  }, [selectedCourseEn]);

  useEffect(() => {
    if (!selectedCourseYo) {
      setModulesYo([]);
      setSelectedModuleYo("");
      return;
    }
    async function fetchModulesYo() {
      const { data, error } = await supabase.from("modules").select("id, title_yo").eq("course_id", selectedCourseYo).order("created_at", { ascending: true });
      if (!error && data) setModulesYo(data);
    }
    fetchModulesYo();
    setSelectedModuleYo("");
    setLessonsYoList([]);
    setSelectedLessonYo("");
  }, [selectedCourseYo]);

  useEffect(() => {
    if (!selectedModuleEn) {
      setLessonsEnList([]);
      setSelectedLessonEn("");
      return;
    }
    async function fetchLessonsEn() {
      const { data, error } = await supabase.from("lessons").select("id, title_en").eq("module_id", selectedModuleEn).order("created_at", { ascending: true });
      if (!error && data) setLessonsEnList(data);
    }
    fetchLessonsEn();
    setSelectedLessonEn("");
  }, [selectedModuleEn]);

  useEffect(() => {
    if (!selectedModuleYo) {
      setLessonsYoList([]);
      setSelectedLessonYo("");
      return;
    }
    async function fetchLessonsYo() {
      const { data, error } = await supabase.from("lessons").select("id, title_yo").eq("module_id", selectedModuleYo).order("created_at", { ascending: true });
      if (!error && data) setLessonsYoList(data);
    }
    fetchLessonsYo();
    setSelectedLessonYo("");
  }, [selectedModuleYo]);

  // fetch distinct age groups once
  useEffect(() => {
    async function fetchAgeGroups() {
      try {
        const { data, error } = await supabase.from("lessons").select("target_audience");
        if (error) throw error;
        const uniqueAges = Array.from(new Set((data || []).map(item => item.target_audience).filter(Boolean)));
        setAgeGroups(uniqueAges.map(age => ({ value: age, label: age })));
      } catch (err) {
        console.error("Failed to load age groups:", err.message);
      }
    }
    fetchAgeGroups();
  }, []);

  /* ---------- Load lesson details when activeLessonId changes ---------- */
  useEffect(() => {
    if (!activeLessonId) {
      setTitleEn("");
      setTitleYo("");
      setDescriptionEn("");
      setDescriptionYo("");
      setAgeGroup("");
      setCategory("");
      setContents([]);
      setQuizzes([]);
      setError(null);
      setSuccess(null);
      return;
    }

    async function fetchLessonDetails() {
      setLoading(true);
      setError(null);
      try {
        const { data: lessonData, error: lessonError } = await supabase.from("lessons").select("*").eq("id", activeLessonId).single();

        if (lessonError || !lessonData) {
          setError("Failed to load lesson details.");
          setLoading(false);
          return;
        }

        setTitleEn(lessonData.title_en || "");
        setTitleYo(lessonData.title_yo || "");
        setDescriptionEn(lessonData.description_en || "");
        setDescriptionYo(lessonData.description_yo || "");
        setAgeGroup(lessonData.target_audience || "");
        setCategory(lessonData.lesson_type || "");

        // content blocks
        const { data, error } = await supabase.from("lessons").select("content_blocks").eq("id", activeLessonId).single();
        if (!error && data) {
          setContents(data.content_blocks || []);
        } else {
          setContents([]);
        }

        // quizzes
        const { data: quizData, error: quizError } = await supabase.from("quizzes").select("*").eq("lesson_id", activeLessonId).order("id", { ascending: true });
        if (!quizError && quizData) {
          const parsed = quizData.map((q) => {
            return {
              ...q,
              options_en: Array.isArray(q.options_en) ? q.options_en : (q.options ? JSON.parse(q.options || "[]") : []),
              options_yo: Array.isArray(q.options_yo) ? q.options_yo : [],
            };
          });
          setQuizzes(parsed);
        } else {
          setQuizzes([]);
        }
      } catch (err) {
        setError("Error loading lesson: " + err.message);
        setQuizzes([]);
      }
      setLoading(false);
    }

    fetchLessonDetails();
  }, [activeLessonId]);

  /* ---------- Content block helpers ---------- */
  const addContentBlock = () => {
    setContents((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        type: "html",
        content_en: "",
        content_yo: "",
        file_en: null,
        file_yo: null,
        uploading_en: false,
        uploading_yo: false,
        url_en: "",
        url_yo: "",
      },
    ]);
  };

  const updateContentBlock = (index, field, value) => {
    setContents((prev) => {
      const updated = [...(Array.isArray(prev) ? prev : [])];
      updated[index] = { ...(updated[index] || {}), [field]: value };
      return updated;
    });
  };

  const removeContentBlock = (index) => {
    const updatedContents = contents.filter((_, i) => i !== index);
    setContents(updatedContents);
    if (activeLessonId) saveContentBlocks(activeLessonId, updatedContents);
  };

  const saveContentBlocks = async (lessonIdToSave, updatedContents) => {
    if (!lessonIdToSave) return;
    const { data, error } = await supabase.from("lessons").update({ content_blocks: updatedContents }).eq("id", lessonIdToSave);
    if (error) {
      console.error("Error saving content blocks:", error);
    } else {
      console.log("Content blocks saved successfully");
    }
  };

  const uploadFile = async (file, contentIndex, lessonIdForFile, lang = "en") => {
    if (!file) return;
    updateContentBlock(contentIndex, `uploading_${lang}`, true);
    setError(null);

    try {
      const fileName = `${Date.now()}-${slugify(file.name, { lower: true })}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      updateContentBlock(contentIndex, `url_${lang}`, data.publicUrl);
      updateContentBlock(contentIndex, `uploading_${lang}`, false);
      updateContentBlock(contentIndex, `content_${lang}`, data.publicUrl);

      if (lessonIdForFile) {
        const { error: updateError } = await supabase.from("lessons").update({ [`file_url_${lang}`]: data.publicUrl }).eq("id", lessonIdForFile);
        if (updateError) throw updateError;
      }
    } catch (err) {
      setError(`File upload failed (${lang.toUpperCase()}): ` + err.message);
      updateContentBlock(contentIndex, `uploading_${lang}`, false);
    }
  };
// image match 
const addMatch = () => {
  setImageMatches(prev => [...prev, { label_en: "", label_yo: "", file: null, url: "", uploading: false }]);
};

const updateMatch = (index, field, value) => {
  setImageMatches(prev => {
    const updated = [...prev];
    updated[index] = { ...(updated[index] || {}), [field]: value };
    return updated;
  });
};

const removeMatch = (index) => {
  setImageMatches(prev => prev.filter((_, i) => i !== index));
};

  /* ---------- Quiz helpers ---------- */
  const addQuiz = () => {
    setQuizzes((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        question_en: "",
        question_yo: "",
        options_en: ["", "", "", ""],
        options_yo: ["", "", "", ""],
        correct_answer_en: "",
        correct_answer_yo: "",
      },
    ]);
  };

  const updateQuiz = (index, field, value) => {
    setQuizzes((prev) => {
      const updated = [...(Array.isArray(prev) ? prev : [])];
      updated[index] = { ...(updated[index] || {}), [field]: value };
      return updated;
    });
  };

  const updateQuizOption = (quizIndex, optionIndex, value, lang = "en") => {
    setQuizzes((prev) => {
      const updated = [...(Array.isArray(prev) ? prev : [])];
      const arrKey = `options_${lang}`;
      const arr = Array.isArray(updated[quizIndex][arrKey]) ? [...updated[quizIndex][arrKey]] : ["", "", "", ""];
      arr[optionIndex] = value;
      updated[quizIndex] = { ...(updated[quizIndex] || {}), [arrKey]: arr };
      return updated;
    });
  };

  const removeQuizLocal = (index) => {
    setQuizzes((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteQuizConfirm = async () => {
    if (!quizToDelete) {
      setIsModalOpen(false);
      return;
    }
    setDeleteError(null);
    setDeleteLoadingId(quizToDelete.id);
    try {
      if (quizToDelete.id) {
        const { error } = await supabase.from("quizzes").delete().eq("id", quizToDelete.id);
        if (error) throw error;
      }
      // remove locally by index
      setQuizzes((prev) => prev.filter((_, idx) => idx !== quizToDelete.index));
      setIsModalOpen(false);
      setQuizToDelete(null);
    } catch (err) {
      console.error("Failed to delete quiz:", err);
      setDeleteError("Failed to delete quiz. Please try again.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  /* ---------- Submit handler ---------- */
  const isValidYouTubeUrl = (url) => {
    if (!url) return false;
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+(&.+)?$/;
    return regex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    let courseId, moduleId, lessonIdToUse;
    if (activeLanguage === "en") {
      courseId = selectedCourseEn;
      moduleId = selectedModuleEn;
      lessonIdToUse = selectedLessonEn;
    } else if (activeLanguage === "yo") {
      courseId = selectedCourseYo;
      moduleId = selectedModuleYo;
      lessonIdToUse = selectedLessonYo;
    } else {
      setError("Please select a lesson in English or Yoruba.");
      return;
    }

    if (!courseId || !moduleId || (!lessonIdToUse && (!titleEn || !titleYo || !ageGroup || !category))) {
      setError("Please fill all required fields.");
      return;
    }

    // Validate YouTube URLs
    for (let i = 0; i < (contents || []).length; i++) {
      const c = contents[i];
      if (c.type === "video" && c.content_en && !isValidYouTubeUrl(c.content_en) && !c.url_en) {
        setError(`Invalid English YouTube URL in block #${i + 1}`);
        return;
      }
      if (c.type === "video" && c.content_yo && !isValidYouTubeUrl(c.content_yo) && !c.url_yo) {
        setError(`Invalid Yoruba YouTube URL in block #${i + 1}`);
        return;
      }
    }

    setLoading(true);

    try {
      const slug = slugify(titleEn || "untitled", { lower: true });

      if (!lessonIdToUse) {
        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .insert([
            {
              module_id: moduleId,
              title_en: titleEn,
              title_yo: titleYo,
              slug,
              description_en: descriptionEn,
              description_yo: descriptionYo,
              target_audience: ageGroup,
              lesson_type: category,
              user_id: adminId,
              content_blocks: contents,
            },
          ])
          .select()
          .single();

        if (lessonError) throw lessonError;
        lessonIdToUse = lessonData.id;
      } else {
        const { error: updateError } = await supabase
          .from("lessons")
          .update({
            title_en: titleEn,
            title_yo: titleYo,
            description_en: descriptionEn,
            description_yo: descriptionYo,
            target_audience: ageGroup,
            lesson_type: category,
            content_blocks: contents,
          })
          .eq("id", lessonIdToUse);

        if (updateError) throw updateError;

        // delete existing quizzes so we reinsert
        await supabase.from("quizzes").delete().eq("lesson_id", lessonIdToUse);
      }

      // insert quizzes
      for (const quiz of quizzes) {
        if (!quiz.question_en || !quiz.question_yo) continue;
        const { error: quizError } = await supabase.from("quizzes").insert([
          {
            lesson_id: lessonIdToUse,
            question_en: quiz.question_en,
            question_yo: quiz.question_yo,
            options_en: quiz.options_en || [],
            options_yo: quiz.options_yo || [],
            correct_answer_en: quiz.correct_answer_en,
            correct_answer_yo: quiz.correct_answer_yo,
            question: quiz.question_en,
            options: JSON.stringify(quiz.options_en || []),
            correct_answer: quiz.correct_answer_en,
          },
        ]);
        if (quizError) throw quizError;
      }

      setSuccess("🔥 Lesson saved successfully!");
      setError(null);

      // clear forms for new lesson creation
      if (!selectedLessonEn && activeLanguage === "en") {
        setTitleEn("");
        setDescriptionEn("");
        setAgeGroup("");
        setCategory("");
        setContents([]);
        setQuizzes([]);
        setSelectedLessonEn("");
      }
      if (!selectedLessonYo && activeLanguage === "yo") {
        setTitleYo("");
        setDescriptionYo("");
        setAgeGroup("");
        setCategory("");
        setContents([]);
        setQuizzes([]);
        setSelectedLessonYo("");
      }

      // refresh lessons list for current module
      if (activeLanguage === "en") {
        const { data } = await supabase.from("lessons").select("id, title_en").eq("module_id", selectedModuleEn).order("created_at", { ascending: true });
        if (data) setLessonsEnList(data);
      } else if (activeLanguage === "yo") {
        const { data } = await supabase.from("lessons").select("id, title_yo").eq("module_id", selectedModuleYo).order("created_at", { ascending: true });
        if (data) setLessonsYoList(data);
      }
    } catch (err) {
      setError("Upload failed: " + err.message);
    }

    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-900 rounded shadow">
        <h1 className="text-3xl font-bold mb-6 text-center">⚡ Admin Lesson Builder</h1>

        {/* Selectors */}
        <LessonSelector
          language="English"
          courses={coursesEn}
          modules={modulesEn}
          lessons={lessonsEnList}
          selectedCourse={selectedCourseEn}
          setSelectedCourse={setSelectedCourseEn}
          selectedModule={selectedModuleEn}
          setSelectedModule={setSelectedModuleEn}
          selectedLesson={selectedLessonEn}
          setSelectedLesson={(val) => {
            setSelectedLessonEn(val);
            setSelectedLessonYo("");
          }}
          clearOtherLanguage={() => setSelectedLessonYo("")}
        />

        <LessonSelector
          language="Yoruba"
          courses={coursesYo}
          modules={modulesYo}
          lessons={lessonsYoList}
          selectedCourse={selectedCourseYo}
          setSelectedCourse={setSelectedCourseYo}
          selectedModule={selectedModuleYo}
          setSelectedModule={setSelectedModuleYo}
          selectedLesson={selectedLessonYo}
          setSelectedLesson={(val) => {
            setSelectedLessonYo(val);
            setSelectedLessonEn("");
          }}
          clearOtherLanguage={() => setSelectedLessonEn("")}
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <LessonInfo
              titleEn={titleEn}
              setTitleEn={setTitleEn}
              titleYo={titleYo}
              setTitleYo={setTitleYo}
              descriptionEn={descriptionEn}
              setDescriptionEn={setDescriptionEn}
              descriptionYo={descriptionYo}
              setDescriptionYo={setDescriptionYo}
              ageGroup={ageGroup}
              setAgeGroup={setAgeGroup}
              ageGroups={ageGroups}
              category={category}
              setCategory={setCategory}
              activeLessonId={activeLessonId}
            />
          </div>

          <ContentBlocks
            contents={contents}
            setContents={setContents}
            addContentBlock={addContentBlock}
            updateContentBlock={updateContentBlock}
            removeContentBlock={removeContentBlock}
            uploadFile={uploadFile}
            activeLessonId={activeLessonId}
          />
<QuizManager
  quizzes={quizzes}
  addQuiz={addQuiz}
  updateQuiz={updateQuiz}
  updateQuizOption={updateQuizOption}
  setQuizToDelete={setQuizToDelete}
  setIsModalOpen={setIsModalOpen}
  setQuizzes={setQuizzes}   // <-- pass this down
/>
<ImageMatchManager
  matches={imageMatches}
  setMatches={setImageMatches}
  addMatch={addMatch}
  updateMatch={updateMatch}
  removeMatch={removeMatch}
  uploadFile={uploadFile}
  activeLessonId={activeLessonId}
/>


          <div className="mt-10 flex gap-4 flex-col sm:flex-row">
            <button type="submit" disabled={loading} className="flex-1 bg-purple-600 text-white font-bold py-3 rounded hover:bg-purple-700">
              {loading ? "Saving..." : activeLessonId ? "Update Lesson" : "Create Lesson"}
            </button>

            <button type="button" onClick={() => setPreviewOpen(true)} className="flex-1 bg-gray-600 text-white font-bold py-3 rounded hover:bg-gray-700">
              Preview Lesson
            </button>
          </div>

          {error && <p className="mt-4 text-red-500">{error}</p>}
          {success && <p className="mt-4 text-green-500">{success}</p>}
        </form>

        {/* Delete quiz modal */}
        <DeleteQuizModal
          isOpen={isModalOpen}
          quizToDelete={quizToDelete}
          onCancel={() => {
            setIsModalOpen(false);
            setQuizToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={deleteQuizConfirm}
          deleteLoadingId={deleteLoadingId}
          deleteError={deleteError}
        />

        {/* Preview modal */}
        {previewOpen && (
          <ContentPreview
            titleEn={titleEn}
            descriptionEn={descriptionEn}
            contents={contents}
            quizzes={quizzes}
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
