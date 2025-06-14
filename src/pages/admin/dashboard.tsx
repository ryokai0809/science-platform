// src/pages/admin/dashboard.tsx

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import type { Subject } from "@/types/subject";

type Grade = {
  id: number;
  name: string;
  subject_id?: number;
  subjects?: Subject;
};

export default function AdminDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [videos, setVideos] = useState<any[]>([]);

  const [newSubject, setNewSubject] = useState("");
  const [newGrade, setNewGrade] = useState({ name: "", subjectId: "" });
  const [newVideo, setNewVideo] = useState({
    title: "",
    url: "",
    description: "",
    gradeId: "",
  });

  const [editingSubject, setEditingSubject] = useState<number | null>(null);
  const [editingGrade, setEditingGrade] = useState<number | null>(null);
  const [editingVideo, setEditingVideo] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: subjects } = await supabase.from("subjects").select("id, name");
    const { data: grades }: { data: Grade[] | null } = await supabase
  .from("grades")
  .select("id, name, subject_id, subjects(name)");
    const { data: videos } = await supabase.from("videos").select("*");

    setSubjects(subjects || []);
    setGrades(grades || []);
    setVideos(videos || []);
  }

  async function addSubject() {
    await supabase.from("subjects").insert({ name: newSubject }).select();
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

  async function deleteSubject(id: number) {
    const { data: grades, error: gradeFetchError } = await supabase
      .from("grades")
      .select("id")
      .eq("subject_id", id);

    if (gradeFetchError) {
      console.error("grade fetch error:", gradeFetchError.message);
      return;
    }

    const gradeIds = grades?.map((g: Grade) => g.id) || [];

    if (gradeIds.length > 0) {
      const { error: videoDeleteError } = await supabase
        .from("videos")
        .delete()
        .in("grade_id", gradeIds);
      if (videoDeleteError) {
        console.error("video delete error:", videoDeleteError.message);
        return;
      }

      const { error: gradeDeleteError } = await supabase
        .from("grades")
        .delete()
        .in("id", gradeIds);
      if (gradeDeleteError) {
        console.error("grade delete error:", gradeDeleteError.message);
        return;
      }
    }

    const { error: subjectDeleteError } = await supabase
      .from("subjects")
      .delete()
      .eq("id", id);
    if (subjectDeleteError) {
      console.error("subject delete error:", subjectDeleteError.message);
    } else {
      fetchData();
    }
  }

  async function deleteGrade(id: number) {
    await supabase.from("grades").delete().eq("id", id);
    fetchData();
  }

  async function deleteVideo(id: number) {
    await supabase.from("videos").delete().eq("id", id);
    fetchData();
  }

  async function updateSubject(id: number, name: string) {
    await supabase.from("subjects").update({ name }).eq("id", id);
    setEditingSubject(null);
    fetchData();
  }

  async function updateGrade(id: number, name: string) {
    await supabase.from("grades").update({ name }).eq("id", id);
    setEditingGrade(null);
    fetchData();
  }

  async function updateVideo(id: number, updated: any) {
    await supabase.from("videos").update(updated).eq("id", id);
    setEditingVideo(null);
    fetchData();
  }

  return (
    <div className="p-6 space-y-6 text-white">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>

      {/* 과목 추가 */}
      <div className="space-y-2">
        <h2 className="text-xl">과목 추가</h2>
        <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
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
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
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
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.subjects?.name ?? "과목 없음"})
            </option>
          ))}
        </select>
        <Input
          placeholder="제목"
          value={newVideo.title}
          onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
        />
        <Input
          placeholder="URL"
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
        <h2 className="text-xl font-semibold">과목 목록</h2>
        <ul className="space-y-1">
          {subjects.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              {editingSubject === s.id ? (
                <>
                  <Input
                    value={s.name}
                    onChange={(e) =>
                      setSubjects(
                        subjects.map((subj) =>
                          subj.id === s.id ? { ...subj, name: e.target.value } : subj
                        )
                      )
                    }
                  />
                  <Button onClick={() => updateSubject(s.id, s.name)}>저장</Button>
                  <Button onClick={() => setEditingSubject(null)}>취소</Button>
                </>
              ) : (
                <>
                  <span>{s.name}</span>
                  <Button onClick={() => setEditingSubject(s.id)}>수정</Button>
                  <Button onClick={() => deleteSubject(s.id)}>삭제</Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
