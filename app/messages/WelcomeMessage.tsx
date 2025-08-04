"use client";
import { useEffect, useState } from "react";

export default function WelcomeMessage() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("hasSeenWelcomeMessage");
      if (!hasSeen) {
        setShow(true);
      }
    }
  }, []);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem("hasSeenWelcomeMessage", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg text-center">
        <p className="mb-4 text-gray-800">
          این سایت یک سایت نوپاست. اگر در هنگام استفاده به مشکلی برخوردید یا نظر و پیشنهادی درباره سایت داشتید میتوانید از طریق ارسال پیام آن را به ما منعکس کنید
        </p>
        <button
          onClick={handleClose}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
}
