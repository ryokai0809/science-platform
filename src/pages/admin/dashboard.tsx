// 단계 1. Supabase 테이블은 다음과 같이 구성되어 있다고 가정합니다:
// - subjects(id, name)
// - grades(id, name, subject_id)
// - videos(id, title, url, description, grade_id)

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

export default function AdminDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [videos, setVideos] = useState([]);

  const [newSubject, setNewSubject] = useState("");
  const [newGrade, setNewGrade] = useState({ name: "", subjectId: "" });
  const [newVideo, setNewVideo] = useState({
    title: "",
    url: "",
    description: "",
    gradeId: "",
  });

  const deleteSubject = async (id: number) => {
  console.log("🧹 과목 삭제 시도:", id);

  // 1. 과목에 연결된 학년 조회
  const { data: grades, error: gradeFetchError } = await supabase
    .from("grades")
    .select("id")
    .eq("subject_id", id);

  if (gradeFetchError) {
    console.error("❌ grade 조회 에러:", gradeFetchError.message);
    return;
  }

  const gradeIds = grades?.map((g: { id: number }) => g.id) || [];
  console.log("📌 연결된 gradeIds:", gradeIds);

  // 2. 연결된 영상 삭제
  if (gradeIds.length > 0) {
    const { error: videoDeleteError } = await supabase
      .from("videos")
      .delete()
      .in("grade_id", gradeIds);

    if (videoDeleteError) {
      console.error("❌ video 삭제 에러:", videoDeleteError.message);
      return;
    } else {
      console.log("✅ 연결된 videos 삭제 완료");
    }

    // 3. 학년 삭제
    const { error: gradeDeleteError } = await supabase
      .from("grades")
      .delete()
      .in("id", gradeIds);

    if (gradeDeleteError) {
      console.error("❌ grade 삭제 에러:", gradeDeleteError.message);
      return;
    } else {
      console.log("✅ 연결된 grades 삭제 완료");
    }
  } else {
    console.log("ℹ️ 연결된 학년이 없습니다. 영상/학년 삭제 생략");
  }

  // 4. 과목 삭제
  const { error: subjectDeleteError } = await supabase
    .from("subjects")
    .delete()
    .eq("id", id);

  if (subjectDeleteError) {
    console.error("❌ subject 삭제 에러:", subjectDeleteError.message);
  } else {
    console.log("✅ subject 삭제 완료");
    fetchData();
  }
};





  const deleteGrade = async (id: number) => {
    await supabase.from("grades").delete().eq("id", id);
    fetchData();
  };

  const deleteVideo = async (id: number) => {
    await supabase.from("videos").delete().eq("id", id);
    fetchData();
  };

   // === 수정用 state ===
  const [editingSubject, setEditingSubject] = useState(null); // id
  const [editingGrade, setEditingGrade] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);

  const updateSubject = async (id: number, name: string) => {
    await supabase.from("subjects").update({ name }).eq("id", id);
    setEditingSubject(null);
    fetchData();
  };

  const updateGrade = async (id: number, name: string) => {
    await supabase.from("grades").update({ name }).eq("id", id);
    setEditingGrade(null);
    fetchData();
  };

  const updateVideo = async (id: number, updated: string) => {
    await supabase.from("videos").update(updated).eq("id", id);
    setEditingVideo(null);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: subjects } = await supabase.from("subjects").select("id, name");
    const { data: grades } = await supabase
       .from("grades")
       .select("id, name, subject_id, subjects(name)");
    const { data: videos } = await supabase.from("videos").select("*");
    setSubjects(subjects);
    setGrades(grades || []);
    setVideos(videos);
  }

  async function addSubject() {
    await supabase.from("subjects").insert({ name: newSubject })
    .select();
    setNewSubject("");
    fetchData();
  }

  async function addGrade() {
    await supabase.from("grades").insert({
      name: newGrade.name,
      subject_id: newGrade.subjectId,
    });
    setNewGrade({ name: "", subjectId: "" });
    fetchData();
  }

  async function addVideo() {
    await supabase.from("videos").insert({
      title: newVideo.title,
      url: newVideo.url,
      description: newVideo.description,
      grade_id: parseInt(newVideo.gradeId),
    });


    setNewVideo({ title: "", url: "", description: "", gradeId: "" });
    fetchData();
  }

  return (
    <div className="p-6 space-y-6 text-white">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>

      {/* 과목 추가 */}
      <div className="space-y-2">
        <h2 className="text-xl">과목 추가</h2>
        <Input
          placeholder="예: 중학교 과학"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
        />
        <Button onClick={addSubject}>과목 추가</Button>
      </div>

      {/* 학년 추가 */}
      <div className="space-y-2">
        <h2 className="text-xl">학년 추가</h2>
        <select
          value={newGrade.subjectId}
          onChange={(e) => setNewGrade({ ...newGrade, subjectId: e.target.value })}
        >
          <option value="">과목 선택</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <Input
          placeholder="예: 1학년"
          value={newGrade.name}
          onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
        />
        <Button onClick={addGrade}>학년 추가</Button>
      </div>

      {/* 동영상 추가 */}
      <div className="space-y-2">
        <h2 className="text-xl">동영상 추가</h2>
        <select
          value={newVideo.gradeId}
          onChange={(e) => setNewVideo({ ...newVideo, gradeId: e.target.value })}
        >
          <option value="">학년 선택</option>
          {Array.isArray(grades) &&
  grades.map((g) => (
    <option key={g.id} value={g.id}>
      {g.name} ({g.subjects?.name})
    </option>
))}
        </select>
        <Input
          placeholder="제목"
          value={newVideo.title}
          onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
        />
        <Input
          placeholder="유튜브 URL"
          value={newVideo.url}
          onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
        />
        <Input
          placeholder="설명"
          value={newVideo.description}
          onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
        />
        <Button onClick={addVideo}>동영상 추가</Button>
      </div>

      {/* 과목 목록 */}
<div>
  <h2>과목 목록</h2>
  <ul>
    {subjects.map((s) => (
      <li key={s.id} className="flex gap-2 items-center">
        {editingSubject === s.id ? (
          <>
            <Input
              value={s.name}
              onChange={(e) => {
                const updated = subjects.map((subj) =>
                  subj.id === s.id ? { ...subj, name: e.target.value } : subj
                );
                setSubjects(updated);
              }}
            />
            <Button onClick={() => updateSubject(s.id, s.name)}>저장</Button>
            <Button onClick={() => setEditingSubject(null)}>취소</Button>
          </>
        ) : (
          <>
            <span>{s.name}</span>
            <Button onClick={() => setEditingSubject(s.id)}>수정</Button>
            <Button onClick={() => {
  console.log("삭제 클릭됨:", s.id);
  deleteSubject(s.id);
}}>삭제</Button>
          </>
        )}
      </li>
    ))}
  </ul>
</div>

      
    </div>
  );
}