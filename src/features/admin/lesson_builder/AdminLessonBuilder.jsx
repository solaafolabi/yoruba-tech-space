import React, { useEffect, useState } from "react";
import supabase from "../../../supabaseClient";
import slugify from "slugify";
import AdminLayout from "../../../features/admin/layout/AdminLayout";

import LessonSelector from "./LessonSelector";
import DeleteQuizModal from "./DeleteQuizModal";
import LessonInfo from "./LessonInfo";
import ContentBlocks from "./ContentBlocks";
import QuizManager from "./QuizManager";
import ContentPreview from "./ContentPreview";
import { v4 as uuidv4 } from "uuid";

export default function AdminLessonBuilder({ adminId }) {
  // stepper state
  const [currentStep, setCurrentStep] = useState(1);

  // ---- your existing states ----
  const [coursesEn, setCoursesEn] = useState([]);
  const [modulesEn, setModulesEn] = useState([]);
  const [lessonsEnList, setLessonsEnList] = useState([]);
  const [selectedCourseEn, setSelectedCourseEn] = useState("");
  const [selectedModuleEn, setSelectedModuleEn] = useState("");
  const [selectedLessonEn, setSelectedLessonEn] = useState("");

  const [coursesYo, setCoursesYo] = useState([]);
  const [modulesYo, setModulesYo] = useState([]);
  const [lessonsYoList, setLessonsYoList] = useState([]);
  const [selectedCourseYo, setSelectedCourseYo] = useState("");
  const [selectedModuleYo, setSelectedModuleYo] = useState("");
  const [selectedLessonYo, setSelectedLessonYo] = useState("");

  const [titleEn, setTitleEn] = useState("");
  const [titleYo, setTitleYo] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionYo, setDescriptionYo] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [category, setCategory] = useState("");
  const [ageGroups, setAgeGroups] = useState([]);

  const [contents, setContents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  const [quizToDelete, setQuizToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const activeLanguage = selectedLessonEn
    ? "en"
    : selectedLessonYo
    ? "yo"
    : null;
  const activeLessonId =
    activeLanguage === "en" ? selectedLessonEn : selectedLessonYo;

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
setContents(
  (lessonData.content_blocks || []).map(block => {
    if (block.type === "kids_html_css") {
      return {
        ...block,
        showHtml: true,
        showCss: true,
        lessonSteps: block.lesson_steps || [],
        initialHtml: block.html_en || "",
        initialCss: block.css_en || "",
      };
    }
    return block;
  })
);


        // quizzes
        const { data: quizData, error: quizError } = await supabase.from("quizzes").select("*").eq("lesson_id", activeLessonId).order("id", { ascending: true });
        if (!quizError && quizData) {
          const parsed = quizData.map((q) => ({
            ...q,
            options_en: Array.isArray(q.options_en) ? q.options_en : (q.options ? JSON.parse(q.options || "[]") : []),
            options_yo: Array.isArray(q.options_yo) ? q.options_yo : [],
          }));
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
  const addContentBlock = (type = "html") => {
  const blockId = uuidv4(); // generate unique UUID for every block
  let block;

  if (type === "blockly") {
    block = { 
      id: blockId, 
      type, 
      gameType: "", 
      instructions_en: "", 
      instructions_yo: "",
      validation_rules: {
        grading_type: "numeric",  // or "string", "boolean", "loops", etc.
        expected_answer: "",
        must_use: [],
        forbidden: [],
        max_blocks: null
      }
    };
  } else if (type === "p5js") {
    block = { 
      id: blockId, 
      type, 
      code: "", 
      instructions_en: "", 
      instructions_yo: "" 
    };
  } else if (type === "kids_html_css") {
    block = {
      id: blockId,
      type,
      html: "",
      css: "",
      show_html: true,
      show_css: true,
      instructions_en: "",
      instructions_yo: "",
    };
  } else if (type === "imagematch") {
    block = {
      id: blockId,
      type,
      pairs: [
        { 
          label_en: "", 
          label_yo: "", 
          file_en: null, 
          file_yo: null, 
          url_en: "", 
          url_yo: "", 
          uploading_en: false, 
          uploading_yo: false 
        }
      ],
      instructions_en: "",
      instructions_yo: "",
    };
  } else if (type === "fabric") {
    block = { 
      id: blockId, 
      type, 
      canvasData: null, 
      instructions_en: "", 
      instructions_yo: "" 
    };
  } else {
    block = {
      id: blockId,
      type,
      content_en: "",
      content_yo: "",
      file_en: null,
      file_yo: null,
      uploading_en: false,
      uploading_yo: false,
      url_en: "",
      url_yo: "",
      instructions_en: "",
      instructions_yo: "",
      validation_rules: {}
    };
  }

  setContents((prev) => [...(Array.isArray(prev) ? prev : []), block]);
};

const updateContentBlock = (index, field, value) => {
  setContents((prev) => {
    const updated = [...prev];
    updated[index] = { 
      ...(updated[index] || {}), 
      [field]: value, 
      id: updated[index].id || uuidv4() 
    };
    return updated;
  });
};

// upload image
const uploadFile = async (file, lang = "en", blockIndex, pairIndex = null) => {
  if (!file) return;

  // mark uploading
  setContents((prev) => {
    const updated = [...prev];
    if (pairIndex !== null) {
      updated[blockIndex].pairs[pairIndex][`uploading_${lang}`] = true;
    } else {
      updated[blockIndex][`uploading_${lang}`] = true;
    }
    return updated;
  });

  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `lessons/${fileName}`; // inside avatars/lessons/

    // upload to Supabase storage (avatars bucket)
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    // get public URL
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data?.publicUrl;

    // update block with URL
    setContents((prev) => {
      const updated = [...prev];
      if (pairIndex !== null) {
        updated[blockIndex].pairs[pairIndex][`url_${lang}`] = publicUrl;
        updated[blockIndex].pairs[pairIndex][`file_${lang}`] = null;
        updated[blockIndex].pairs[pairIndex][`uploading_${lang}`] = false;
      } else {
        updated[blockIndex][`url_${lang}`] = publicUrl;
        updated[blockIndex][`file_${lang}`] = null;
        updated[blockIndex][`uploading_${lang}`] = false;
      }
      return updated;
    });
  } catch (err) {
    console.error("Upload failed:", err.message);
    setError("Image upload failed: " + err.message);

    // reset uploading state on failure
    setContents((prev) => {
      const updated = [...prev];
      if (pairIndex !== null) {
        updated[blockIndex].pairs[pairIndex][`uploading_${lang}`] = false;
      } else {
        updated[blockIndex][`uploading_${lang}`] = false;
      }
      return updated;
    });
  }
};

  /* ---------- Quiz helpers ---------- */
  const addQuiz = () => {
    setQuizzes((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { question_en: "", question_yo: "", options_en: ["", "", "", ""], options_yo: ["", "", "", ""], correct_answer_en: "", correct_answer_yo: "" },
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

  const removeQuizLocal = (index) => setQuizzes((prev) => prev.filter((_, i) => i !== index));

  const deleteQuizConfirm = async () => {
    if (!quizToDelete) { setIsModalOpen(false); return; }
    setDeleteError(null);
    setDeleteLoadingId(quizToDelete.id);
    try {
      if (quizToDelete.id) {
        const { error } = await supabase.from("quizzes").delete().eq("id", quizToDelete.id);
        if (error) throw error;
      }
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

    // Validate YouTube URLs in content blocks
    for (let i = 0; i < (contents || []).length; i++) {
      const c = contents[i];
      if (c.type === "video") {
        if (c.content_en && !isValidYouTubeUrl(c.content_en) && !c.url_en) {
          setError(`Invalid English YouTube URL in block #${i + 1}`);
          return;
        }
        if (c.content_yo && !isValidYouTubeUrl(c.content_yo) && !c.url_yo) {
          setError(`Invalid Yoruba YouTube URL in block #${i + 1}`);
          return;
        }
      }
    }

    setLoading(true);

    try {
      const slug = slugify(titleEn || "untitled", { lower: true });

      if (!lessonIdToUse) {
        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .insert([{ module_id: moduleId, title_en: titleEn, title_yo: titleYo, slug, description_en: descriptionEn, description_yo: descriptionYo, target_audience: ageGroup, lesson_type: category, user_id: adminId, content_blocks: contents }])
          .select()
          .single();
        if (lessonError) throw lessonError;
        lessonIdToUse = lessonData.id;
      } else {
        const { error: updateError } = await supabase.from("lessons").update({ title_en: titleEn, title_yo: titleYo, description_en: descriptionEn, description_yo: descriptionYo, target_audience: ageGroup, lesson_type: category, content_blocks: contents }).eq("id", lessonIdToUse);
        if (updateError) throw updateError;
        await supabase.from("quizzes").delete().eq("lesson_id", lessonIdToUse);
      }

try {
  const payload = quizzes
    .filter((q) => q.question_en && q.question_yo)
    .map((quiz) => ({
      lesson_id: lessonIdToUse,
      question: quiz.question_en, // base
      options: quiz.options_en || [], // base
      correct_answer: quiz.correct_answer_en, // base
      question_en: quiz.question_en,
      question_yo: quiz.question_yo,
      options_en: quiz.options_en || [],
      options_yo: quiz.options_yo || [],
      correct_answer_en: quiz.correct_answer_en,
      correct_answer_yo: quiz.correct_answer_yo,
    }));

  console.log("📦 Payload to insert:", payload);

  const { data, error } = await supabase
    .from("quizzes")
    .insert(payload)
    .select();

  if (error) {
    console.error("❌ Insert error:", error);
  } else {
    console.log("✅ Insert success:", data);
  }
} catch (err) {
  console.error("🔥 Exception during insert:", err);
}



      setSuccess("🔥 Lesson saved successfully!");
      setError(null);

      if (!selectedLessonEn && activeLanguage === "en") setContents([]);
      if (!selectedLessonYo && activeLanguage === "yo") setContents([]);

      // refresh lessons list
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

   const steps = [
    { id: 1, label: "Select Lesson" },
    { id: 2, label: "Lesson Info" },
    { id: 3, label: "Content Blocks" },
    { id: 4, label: "Quizzes" },
    { id: 5, label: "Preview & Save" },
  ];

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, steps.length));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-900 rounded shadow">
        <h1 className="text-3xl font-bold mb-6 text-center">⚡ Admin Lesson Builder</h1>

        {/* Progress Bar */}
        <div className="flex justify-between mb-6">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex-1 text-center font-medium ${
                currentStep === step.id ? "text-purple-600" : "text-gray-400"
              }`}
            >
              {step.label}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Lesson Selector */}
          {currentStep === 1 && (
            <>
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
            </>
          )}

          {/* Step 2: Lesson Info */}
          {currentStep === 2 && (
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
          )}

          {/* Step 3: Content Blocks */}
          {currentStep === 3 && (
            <>
              <ContentBlocks
                contents={contents}
                setContents={setContents}
                addContentBlock={addContentBlock}
                updateContentBlock={updateContentBlock}
               removeContentBlock={(index) =>
  setContents((prev) => prev.filter((_, i) => i !== index))
}
                 uploadFile={uploadFile} 
                activeLessonId={activeLessonId}
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => addContentBlock("imagematch")} className="bg-yellow-400 px-4 py-2 rounded">+ Image Match Block</button>
                <button type="button" onClick={() => addContentBlock("blockly")} className="bg-purple-400 px-4 py-2 rounded">+ Blockly Block</button>
                <button type="button" onClick={() => addContentBlock("p5js")} className="bg-green-400 px-4 py-2 rounded">+ p5.js Block</button>
                <button type="button" onClick={() => addContentBlock("kids_html_css")} className="bg-pink-400 px-4 py-2 rounded">+ Kids HTML & CSS Block</button>
              </div>
            </>
          )}

          {/* Step 4: Quizzes */}
          {currentStep === 4 && (
            <QuizManager
  quizzes={quizzes}
  addQuiz={addQuiz}
  updateQuiz={updateQuiz}
  updateQuizOption={updateQuizOption}
  removeQuizLocal={removeQuizLocal} // pass remove handler
  setQuizToDelete={setQuizToDelete}
  setIsModalOpen={setIsModalOpen}
  setQuizzes={setQuizzes}
/>

          )}

          {/* Step 5: Preview & Save */}
         {currentStep === 5 && (
  <>
    <button
      type="button"
      className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      onClick={() => setPreviewOpen(true)}
    >
      Preview Lesson
    </button>

    {previewOpen && (
      <ContentPreview
        titleEn={titleEn}
        descriptionEn={descriptionEn}
        contents={contents}
        quizzes={quizzes}
        onClose={() => setPreviewOpen(false)}
      />
    )}

    <button
      type="submit"
      disabled={loading}
      className="w-full mt-6 bg-purple-600 text-white font-bold py-3 rounded hover:bg-purple-700"
    >
      {loading ? "Saving..." : activeLessonId ? "Update Lesson" : "Create Lesson"}
    </button>
  </>
)}

          {/* Step Navigation */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 rounded bg-gray-300 dark:bg-gray-700"
              >
                Previous
              </button>
            )}
            {currentStep < steps.length && (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto px-6 py-2 rounded bg-purple-600 text-white"
              >
                Next
              </button>
            )}
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


      </div>
    </AdminLayout>
  );
}