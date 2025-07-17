// /pages/thanks.tsx
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";

export default function Thanks() {
  const router = useRouter();
  const { session_id } = router.query;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center space-y-6">
      <h1 className="text-3xl font-bold">결제가 완료되었습니다 🎉</h1>

      {/* 1) 강의 바로가기 */}
      <Button
        onClick={() => router.push("/")}
        className="bg-[#EA6137] text-white rounded-full px-8 py-2"
      >
        강의 선택으로 이동
      </Button>

      {/* 2) 영수증 PDF 다운로드 */}
      {session_id && (
        <a
          href={`/api/receipt?session_id=${session_id}`}
          className="text-[#EA6137] underline hover:text-[#d4542e]"
        >
          📄 영수증(PDF) 다운로드
        </a>
      )}
    </main>
  );
}
