// pages/cancel.tsx
import { useRouter } from "next/router";
import { Button } from "../components/ui/button";

export default function CancelPage() {
  return (
    <div className="text-center mt-16 text-white">
      <h1 className="text-2xl font-bold mb-4">決済がキャンセルされました</h1>
      <p>もう一度お試しいただくか、お問い合わせください。</p>
      <Button
        className="mt-6 bg-primary text-white rounded-full px-6 py-2"
        onClick={() => window.history.back()}
      >
        戻る
      </Button>
    </div>
  );
}
