import { useEffect } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { toast } from "react-toastify";
import { useNotifications } from "../context/NotificationContext";
import { fetchAlarmList } from "../api/scheduleApi"; 

const NotificationListener = ({ userId, updateAlarms }) => {
  const { addNotification } = useNotifications();
  console.log("🧪 NotificationListener 시작됨, userId:", userId);

  useEffect(() => {
    if (!userId) {
      console.warn("❌ WebSocket 연결 생략 - userId 없음");
      return;
    }

    // toast.info("✅ 토스트 테스트 메시지!");
    // const socket = new SockJS("hhttps://learn-alive-5d351ee528be.herokuapp.com/ws");

    const stompClient = new Client({
      webSocketFactory: () => new SockJS("https://learn-alive-5d351ee528be.herokuapp.com/ws"),
      connectHeaders: {
        login: userId, // ✅ 백엔드에서 Principal로 쓸 사용자 ID 전달!
      },
      reconnectDelay: 5000,
    });

    stompClient.onConnect = () => {

      // ✅ [게시글/공지/시험 등] 클래스 관련 실시간 알림
      stompClient.subscribe(`/topic/user/${userId}`, (message) => {
        const data = JSON.parse(message.body);
        console.log("📥 수신된 알림:", data);
        addNotification(data); // 저장

        const time = new Date(data.createdAt).toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        let emoji = "🔔";
        if (data.type === "POST") emoji = "📝";
        else if (data.type === "EXAM") emoji = "🧪";
        else if (data.type === "NOTICE") emoji = "📢";
        else if (data.type === "SURVEY") emoji = "📊";

        toast.info(`${emoji} ${data.title}\n📅 ${time}`, {
          position: "top-right",
          autoClose: 4000,
        });
      });

      // ✅ [F학점 경고 등] 개인 경고성 알림
      stompClient.subscribe(`/user/topic/alerts`, async (message) => {
        const data = JSON.parse(message.body);
        addNotification(data);
      
        // ✅ 알림 리스트 새로 갱신
        updateAlarms(prev => [data, ...prev]);
      
        toast.warn(`⚠️ ${data.title}\n📌 ${data.content}`, {
          position: "top-right",
          autoClose: 5000,
        });
      });
       

      // ✅ (선택) global 채널 구독 <subscribe는 반드시 온커넥트 내부에서!!!>
      stompClient.subscribe("/topic/global", (message) => {
        const data = JSON.parse(message.body);
        addNotification(data);
        toast.info(`📢 공지: ${data.title}`);
      });
    };

    stompClient.onStompError = (frame) => {
      console.error("❌ WebSocket 오류:", frame);
    };

    stompClient.activate();
    return () => stompClient.deactivate();
  }, []);

  return null;
};

export default NotificationListener;
